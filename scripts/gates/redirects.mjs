#!/usr/bin/env node
/**
 * Redirect gate: every redirect in the content is in the output, as the mode chosen with BORDA_REDIRECTS says.
 *   html (default): a page at the old path with a meta refresh and a canonical link to the new one (any static host);
 *   file: a `from to status` line in dist/_redirects (Netlify, Cloudflare Pages: a real 3xx) and no page at the old path.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isExternal, servedRedirects } from "../../src/borda/redirects.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dist = join(root, "dist");
const { url, redirects: mode, sites } = JSON.parse(await readFile(join(root, ".borda/content.json"), "utf8"));
const base = new URL(url).pathname.replace(/\/+$/, "");
const wanted = sites.flatMap(servedRedirects);
if (!wanted.length) {
  console.log("✓ gates:redirects: the content has no redirects");
  process.exit(0);
}
const failures = [];
const file = existsSync(join(dist, "_redirects")) ? await readFile(join(dist, "_redirects"), "utf8") : "";
for (const r of wanted) {
  const page = join(dist, r.from, "index.html");
  if (mode === "html") {
    const target = isExternal(r.to) ? r.to : `${url}${r.to}`;
    const html = existsSync(page) ? await readFile(page, "utf8") : "";
    if (!html) failures.push(`${r.from}: no redirect page`);
    else if (!html.includes(`content="0;url=${target}"`) || !html.includes(`rel="canonical" href="${target}"`)) failures.push(`${r.from}: the page does not point to ${target}`);
  } else {
    const line = `${base}${r.from} ${isExternal(r.to) ? r.to : `${base}${r.to}`} ${r.status}`;
    if (!file.split("\n").includes(line)) failures.push(`${r.from}: no line "${line}" in dist/_redirects`);
    if (existsSync(page)) failures.push(`${r.from}: a page exists at the old path, so the host would serve it instead of the 3xx`);
  }
}
if (failures.length) {
  console.error(`✗ gates:redirects\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ gates:redirects: ${wanted.length} redirect(s) as ${mode === "html" ? "pages" : "dist/_redirects lines"}`);
