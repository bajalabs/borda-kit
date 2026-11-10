/**
 * A site's redirects as served paths. `from` and a path `to` are relative to the site's mount (a secondary site's
 * /old-slug is served at /es/old-slug); an http(s) `to` is kept as it is. Erasable TypeScript, no imports.
 */
export interface RedirectRule { from: string; to: string; status: number }
export interface Mounted { prefix: string; site: { redirects: RedirectRule[] } }

export const isExternal = (to: string) => /^https?:\/\//i.test(to);

export function servedRedirects(bundle: Mounted): RedirectRule[] {
  return bundle.site.redirects.map((r) => ({ from: `${bundle.prefix}${r.from}`, to: isExternal(r.to) ? r.to : `${bundle.prefix}${r.to}`, status: r.status }));
}

/** The `_redirects` file Netlify and Cloudflare Pages read: one `from to status` line per rule, with the base path. */
export function redirectsFile(bundles: Mounted[], base = ""): string {
  const lines = bundles.flatMap(servedRedirects).map((r) => `${base}${r.from} ${isExternal(r.to) ? r.to : `${base}${r.to}`} ${r.status}`);
  return lines.length ? `${lines.join("\n")}\n` : "";
}
