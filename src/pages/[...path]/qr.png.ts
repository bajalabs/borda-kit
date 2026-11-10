/** The board's QR as a PNG for print (1024 px), beside the SVG. */
import type { APIRoute, GetStaticPaths } from "astro";
import { entries, origin } from "../../borda/bundle.ts";
import { qrPng } from "../../borda/qr.ts";
export const getStaticPaths = (() => entries.map((e) => ({ params: { path: e.path.slice(1) }, props: { e } }))) satisfies GetStaticPaths;
export const GET: APIRoute = ({ props }) => {
  const { e } = props as { e: (typeof entries)[number] };
  return new Response(qrPng(`${origin}${e.path}`, { color: "#111111", title: e.board.full_name }), { headers: { "content-type": "image/png" } });
};
