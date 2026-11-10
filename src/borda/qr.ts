/**
 * QR code as a standalone SVG, generated at build time with uqr (unjs, zero dependencies).
 * Error correction M, a four-module quiet zone, and one path with horizontal runs merged,
 * so the file stays small and scales without blur.
 */
import { encode } from "uqr";
import { Resvg } from "@resvg/resvg-js";

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function qrSvg(text: string, options: { color: string; title: string }): string {
  const qr = encode(text, { ecc: "M", border: 4 });
  const size = qr.size;
  let d = "";
  for (let y = 0; y < size; y++) {
    const row = qr.data[y] ?? [];
    let x = 0;
    while (x < size) {
      if (!row[x]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < size && row[x + run]) run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * 8}" height="${size * 8}" shape-rendering="crispEdges" role="img">` +
    `<title>${escapeXml(options.title)}</title>` +
    `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
    `<path fill="${escapeXml(options.color)}" d="${d}"/>` +
    `</svg>\n`
  );
}

/** The same code as a PNG for print: the SVG rasterised with resvg at `size` px wide (1024 by default), quiet zone included. */
export function qrPng(text: string, options: { color: string; title: string; size?: number }): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new Resvg(qrSvg(text, options), { fitTo: { mode: "width", value: options.size ?? 1024 } }).render().asPng());
}
