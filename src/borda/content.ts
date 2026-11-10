/**
 * Reads the content folder: every directory with a `site.json` is a site, its `boards/<slug>.json` files are the boards.
 * Every file is validated against src/borda/schema.ts and every problem is reported at once, with the file it came from.
 * Erasable TypeScript: scripts/borda-load.mjs and the tests import it directly.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, isAbsolute, join, normalize, relative, sep } from "node:path";
import { type Board, BoardSchema, type Bundle, type Content, formatIssues, KEY, type ResolvedPhoto, SiteSchema } from "./schema.ts";

export const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

export class ContentError extends Error {
  problems: string[];
  constructor(problems: string[]) {
    super(`the content is invalid:\n  ${problems.join("\n  ")}`);
    this.problems = problems;
  }
}

type Env = Record<string, string | undefined>;
const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");

function readJson(file: string, label: string, problems: string[]): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    problems.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    return undefined;
  }
}

/** The site folders under `root`, sorted: any directory holding a site.json. */
export function siteKeys(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(root, d.name, "site.json")))
    .map((d) => d.name)
    .sort();
}

function resolvePhoto(root: string, photo: NonNullable<ReturnType<typeof BoardSchema.parse>["photo"]>, label: string, problems: string[]): ResolvedPhoto | null {
  const common = { alt: photo.alt ?? null, focal: photo.focal ?? null, credit: photo.credit ?? null };
  if (/^https:\/\//.test(photo.src)) return { kind: "remote", url: photo.src, width: photo.width ?? null, height: photo.height ?? null, ...common };
  if (/^[a-z]+:/i.test(photo.src) || isAbsolute(photo.src)) {
    problems.push(`${label}: photo.src must be a path under content/ or an https URL`);
    return null;
  }
  const path = normalize(photo.src).split(sep).join("/");
  const file = join(root, path);
  if (path.startsWith("../") || relative(root, file).startsWith("..")) {
    problems.push(`${label}: photo.src ${photo.src} points outside content/`);
    return null;
  }
  if (!PHOTO_EXTENSIONS.includes(extname(path).toLowerCase())) {
    problems.push(`${label}: photo.src ${photo.src} must be one of ${PHOTO_EXTENSIONS.join(", ")}`);
    return null;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    problems.push(`${label}: photo ${photo.src} is not in content/`);
    return null;
  }
  return { kind: "local", path, sha256: sha256(readFileSync(file)), ...common };
}

/** The public URL of the primary site, without a trailing slash; it may carry a base path (GitHub Pages project sites). */
export function siteUrl(boardsDomain: string, override: string | undefined): string {
  const raw = override?.trim() || `https://${boardsDomain}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new ContentError([`BORDA_SITE_URL is not a URL: ${raw}`]);
  }
  if (!/^https?:$/.test(u.protocol) || u.search || u.hash) throw new ContentError([`BORDA_SITE_URL must be an http(s) URL without a query or fragment: ${raw}`]);
  return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
}

/** Loads, validates and orders the content for one build. Throws ContentError with every problem found. */
export function loadContent(root: string, env: Env = process.env): Content {
  const problems: string[] = [];
  const available = siteKeys(root);
  const wanted = list(env.BORDA_SITES);
  for (const k of wanted) if (!available.includes(k)) problems.push(`BORDA_SITES names ${k}, but content/${k}/site.json does not exist`);
  const keys = wanted.length ? wanted.filter((k) => available.includes(k)) : available;
  if (!keys.length) throw new ContentError([...problems, `no site found: add content/<site>/site.json (see content/README.md)`]);

  const drafts = env.BORDA_DRAFTS === "1";
  const sites: (Bundle & { primaryFlag: boolean })[] = [];
  for (const key of keys) {
    if (!KEY.test(key)) problems.push(`content/${key}: a site folder name must be lowercase words joined by hyphens`);
    const label = `content/${key}/site.json`;
    const rawSite = readJson(join(root, key, "site.json"), label, problems);
    const parsedSite = rawSite === undefined ? null : SiteSchema.safeParse(rawSite);
    if (parsedSite && !parsedSite.success) for (const issue of formatIssues(parsedSite.error)) problems.push(`${label}: ${issue}`);
    // The boards are checked even when site.json is not, so one run reports every problem.
    const boards: Board[] = [];
    const dir = join(root, key, "boards");
    const files = existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith(".json"))
          .sort()
      : [];
    for (const file of files) {
      const slug = file.slice(0, -".json".length);
      const bLabel = `content/${key}/boards/${file}`;
      if (!KEY.test(slug)) {
        problems.push(`${bLabel}: the file name is the slug; use lowercase words joined by hyphens`);
        continue;
      }
      const rawBoard = readJson(join(dir, file), bLabel, problems);
      if (rawBoard === undefined) continue;
      const parsed = BoardSchema.safeParse(rawBoard);
      if (!parsed.success) {
        for (const issue of formatIssues(parsed.error)) problems.push(`${bLabel}: ${issue}`);
        continue;
      }
      const { $schema: _boardSchema, photo, ...board } = parsed.data;
      if (board.status === "draft" && !drafts) continue;
      boards.push({ ...board, slug, photo: photo ? resolvePhoto(root, photo, bLabel, problems) : null });
    }
    if (!parsedSite?.success) continue;
    const { $schema: _siteSchema, ...site } = parsedSite.data;
    boards.sort((a, b) => a.sort - b.sort || a.slug.localeCompare(b.slug));
    const content_sha256 = sha256(JSON.stringify({ site, boards }));
    sites.push({ key, prefix: "", content_sha256, site, boards, primaryFlag: site.primary });
  }
  if (problems.length) throw new ContentError(problems);

  // The primary site: the first one BORDA_SITES names, else the one marked primary, else the only one.
  let primaryKey: string | undefined = wanted[0];
  if (!primaryKey) {
    const marked = sites.filter((s) => s.primaryFlag);
    if (marked.length > 1) problems.push(`more than one site has "primary": true (${marked.map((s) => s.key).join(", ")})`);
    primaryKey = marked[0]?.key ?? (sites.length === 1 ? sites[0]?.key : undefined);
    if (!primaryKey) problems.push(`${sites.length} sites and none has "primary": true; mark one, or name the sites in BORDA_SITES`);
  }
  const ordered = [...sites.filter((s) => s.key === primaryKey), ...sites.filter((s) => s.key !== primaryKey)];
  const prefixes = new Set<string>();
  for (const [i, s] of ordered.entries()) {
    s.prefix = i === 0 ? "" : `/${s.site.locale.slice(0, 2)}`;
    if (i > 0 && prefixes.has(s.prefix)) problems.push(`content/${s.key}: another site already uses ${s.prefix}; one site per language`);
    prefixes.add(s.prefix);
  }
  const primary = ordered[0];
  if (problems.length || !primary) throw new ContentError(problems);
  for (const s of ordered.slice(1)) {
    const clash = primary.boards.find((b) => `/${b.slug}` === s.prefix);
    if (clash) problems.push(`content/${primary.key}/boards/${clash.slug}.json: the slug collides with ${s.key}'s ${s.prefix}/ path`);
  }
  for (const s of ordered) {
    for (const r of s.site.redirects) {
      const hit = s.boards.find((b) => `/${b.slug}` === r.from);
      if (hit) problems.push(`content/${s.key}/site.json: the redirect from ${r.from} would hide the board ${hit.slug}`);
    }
  }
  if (problems.length) throw new ContentError(problems);

  const redirects = env.BORDA_REDIRECTS === "file" ? "file" : "html";
  if (env.BORDA_REDIRECTS && !["file", "html"].includes(env.BORDA_REDIRECTS)) throw new ContentError([`BORDA_REDIRECTS must be html or file, not ${env.BORDA_REDIRECTS}`]);
  return {
    url: siteUrl(primary.site.boards_domain, env.BORDA_SITE_URL),
    redirects,
    noindex: env.BORDA_NOINDEX === "1" || ordered.some((s) => s.site.demo),
    sites: ordered.map(({ primaryFlag: _p, ...s }) => s),
  };
}
