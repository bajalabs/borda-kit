/**
 * Social card per board (1200×630 JPEG) with satori + resvg at build time. With a photo: the photo as a left band cropped around its
 * focal point, name, role line and site name on the right; without one: the text on the brand's gradient.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";
import satori from "satori";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { entries } from "../../borda/bundle.ts";
import type { ResolvedPhoto } from "../../borda/schema.ts";
import { brand } from "../../brand/index.ts";
export const getStaticPaths = (() => entries.map((e) => ({ params: { path: e.path.slice(1) }, props: { e } }))) satisfies GetStaticPaths;
const font = readFileSync(join(process.cwd(), brand.og.fontFile));
const mark = (() => { try { return brand.og.mark ? `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), brand.og.mark)).toString("base64")}` : null; } catch { return null; } })();
const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });
const BAND = { width: 480, height: 630 };
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const photos = new Map<string, Promise<string | null>>();

/** The photo's bytes: the file under content/ or, for a remote photo, one fetch per build. */
async function photoBytes(m: ResolvedPhoto): Promise<Buffer> {
  if (m.kind === "local") return readFileSync(join(process.cwd(), "content", m.path));
  const res = await fetch(m.url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** The photo cropped to the band around its focal point (cover), as a JPEG data URI; null when it cannot be read. */
function photoBand(m: ResolvedPhoto, slug: string): Promise<string | null> {
  const id = m.kind === "local" ? m.path : m.url;
  const cached = photos.get(id);
  if (cached) return cached;
  const p = (async () => {
    try {
      const img = sharp(await photoBytes(m)).rotate();
      const { width: sw, height: sh } = await img.metadata();
      if (!sw || !sh) throw new Error("no dimensions");
      const scale = Math.max(BAND.width / sw, BAND.height / sh);
      const cw = Math.min(sw, Math.round(BAND.width / scale)), ch = Math.min(sh, Math.round(BAND.height / scale));
      const fx = m.focal?.x ?? 0.5, fy = m.focal?.y ?? 0.5;
      const left = clamp(Math.round(sw * fx - cw / 2), 0, sw - cw), top = clamp(Math.round(sh * fy - ch / 2), 0, sh - ch);
      const jpeg = await img.extract({ left, top, width: cw, height: ch }).resize(BAND.width, BAND.height).jpeg({ quality: 86 }).toBuffer();
      return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
    } catch (e) {
      console.warn(`og: ${slug}: the photo is left out of the social card (${e instanceof Error ? e.message : String(e)})`);
      return null;
    }
  })();
  photos.set(id, p);
  return p;
}

export const GET: APIRoute = async ({ props }) => {
  const { e } = props as { e: (typeof entries)[number] };
  const m = e.board.photo;
  const band = m ? await photoBand(m, e.board.slug) : null;
  const name = e.board.full_name;
  const nameSize = band ? (name.length > 22 ? 52 : name.length > 16 ? 60 : 68) : name.length > 26 ? 64 : 76;
  const text = [
    el("div", { fontSize: band ? 26 : 30, letterSpacing: 2, textTransform: "uppercase", opacity: 0.75 }, e.bundle.site.name),
    el("div", { fontSize: nameSize, fontWeight: 700, lineHeight: 1.05, marginTop: 16 }, name),
    el("div", { fontSize: band ? 32 : 36, marginTop: 18, opacity: 0.9 }, e.board.title ?? e.bundle.site.boards_domain),
  ];
  const root = band
    ? el("div", { width: 1200, height: 630, display: "flex", flexDirection: "row", background: `linear-gradient(135deg, ${brand.og.from}, ${brand.og.to})`, color: brand.og.text, fontFamily: brand.og.fontFamily }, [
        { type: "img", props: { src: band, width: BAND.width, height: BAND.height, style: { width: BAND.width, height: BAND.height, objectFit: "cover" } } },
        el("div", { position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "64px 64px 72px" }, [
          ...(mark ? [{ type: "img", props: { src: mark, style: { position: "absolute", top: 56, right: 64, height: 64, opacity: 0.9 } } }] : []),
          ...text,
        ]),
      ])
    : el("div", { width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, background: `linear-gradient(135deg, ${brand.og.from}, ${brand.og.to})`, color: brand.og.text, fontFamily: brand.og.fontFamily }, [
        ...(mark ? [{ type: "img", props: { src: mark, style: { position: "absolute", top: 64, right: 72, height: 72, opacity: 0.9 } } }] : []),
        ...text,
      ]);
  const svg = await satori(root, { width: 1200, height: 630, fonts: [{ name: brand.og.fontFamily, data: font, weight: brand.og.fontWeight, style: "normal" }] });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  const jpeg = await sharp(png).jpeg({ quality: 82 }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "content-type": "image/jpeg" } });
};
