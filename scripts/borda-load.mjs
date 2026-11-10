#!/usr/bin/env node
/**
 * Prebuild: read content/, validate every site and board file, write .borda/.
 *
 *   .borda/content.json  the validated sites (primary first) the pages and astro.config.mjs read
 *   .borda/build.json    the build receipt served at /.well-known/borda-build.json (which content shipped)
 *
 * Settings (environment): BORDA_SITES, BORDA_SITE_URL, BORDA_DRAFTS, BORDA_REDIRECTS, BORDA_NOINDEX (see README.md).
 * Any problem fails the build with the file it came from: the boards never ship content that did not validate.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ContentError, loadContent } from "../src/borda/content.ts";

const root = new URL("../", import.meta.url);
const contentDir = fileURLToPath(new URL("content/", root));

let content;
try {
  content = loadContent(contentDir, process.env);
} catch (e) {
  if (e instanceof ContentError) {
    console.error(`\n✗ borda-load: ${e.message}\n`);
    process.exit(1);
  }
  throw e;
}
const receipt = {
  version: 1,
  url: content.url,
  sites: content.sites.map((s) => ({ site: s.key, locale: s.site.locale, boards: s.boards.length, content_sha256: s.content_sha256 })),
  built_at: new Date().toISOString(),
};
await mkdir(new URL(".borda/", root), { recursive: true });
await writeFile(new URL(".borda/content.json", root), `${JSON.stringify(content, null, 2)}\n`);
await writeFile(new URL(".borda/build.json", root), `${JSON.stringify(receipt, null, 2)}\n`);
for (const s of content.sites) console.log(`borda-load: ${s.key} at ${s.prefix || "/"} (${s.boards.length} boards, ${s.content_sha256.slice(0, 12)})`);
console.log(`borda-load: ${content.url} · redirects as ${content.redirects}${content.noindex ? " · noindex" : ""}`);
