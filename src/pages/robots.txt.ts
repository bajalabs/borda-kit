import type { APIRoute } from "astro";
import { noindex, origin } from "../borda/bundle.ts";
/** Indexed by default; BORDA_NOINDEX=1 (previews) and demo content ask crawlers to stay out. */
export const GET: APIRoute = () =>
  new Response(noindex ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap-index.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
