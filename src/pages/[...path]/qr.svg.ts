import type { APIRoute, GetStaticPaths } from "astro";
import { entries, origin } from "../../borda/bundle.ts";
import { qrSvg } from "../../borda/qr.ts";
export const getStaticPaths = (() => entries.map((e) => ({ params: { path: e.path.slice(1) }, props: { e } }))) satisfies GetStaticPaths;
export const GET: APIRoute = ({ props }) => {
  const { e } = props as { e: (typeof entries)[number] };
  return new Response(qrSvg(`${origin}${e.path}`, { color: "#111111", title: e.board.full_name }), { headers: { "content-type": "image/svg+xml; charset=utf-8" } });
};
