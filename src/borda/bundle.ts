/** The validated content, loaded once per build (primary site at /, further sites under /<language>/). */
import raw from "../../.borda/content.json?raw";
import type { Board, Bundle, Content } from "./schema.ts";

const content: Content = JSON.parse(raw);
export const bundles: Bundle[] = content.sites;
export const primary = bundles[0] as Bundle;
/** The public URL of the primary site, base path included, no trailing slash: canonical links, QR codes, vCards and OG images use it. */
export const origin = content.url;
export const noindex = content.noindex;
export const redirectMode = content.redirects;
/** The base path the site is served under ("" at a domain's root, "/repo" on a GitHub Pages project site). */
export const base = new URL(content.url).pathname.replace(/\/+$/, "");
/** A site path as a link: the base path in front, "/" for the root. */
export const href = (path: string) => `${base}${path}` || "/";
export const prefixOf = (b: Bundle) => b.prefix;
export const boardPath = (b: Bundle, slug: string) => `${b.prefix}/${slug}`;
export const thankYouPath = (b: Bundle) => `${b.prefix}${b.site.locale.startsWith("es") ? "/gracias" : "/thank-you"}`;
export interface Entry {
  bundle: Bundle;
  board: Board;
  path: string;
}
export const entries: Entry[] = bundles.flatMap((bundle) => bundle.boards.map((board) => ({ bundle, board, path: boardPath(bundle, board.slug) })));
export const lang = (b: Bundle) => b.site.locale.slice(0, 2);
