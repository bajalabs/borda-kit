// @ts-check
/**
 * One codebase, one brand's boards: scripts/borda-load.mjs validates content/ and writes .borda/content.json, which
 * this file reads for the site URL (and base path), the redirects and the remote photo hosts. Static output, no
 * adapter: dist/ runs on any static host.
 */
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { redirectsFile, servedRedirects } from "./src/borda/redirects.ts";

/** @type {import("./src/borda/schema.ts").Content} */
let content;
try {
  content = JSON.parse(readFileSync(new URL("./.borda/content.json", import.meta.url), "utf8"));
} catch {
  throw new Error(".borda/content.json is missing: run `pnpm content` (pnpm dev and pnpm build do it for you).");
}
const url = new URL(content.url);
const base = url.pathname.replace(/\/+$/, "");
/** The hosts remote photos come from, so <Image> optimises them at build time (sharp; no runtime image service). */
const photoHosts = [...new Set(content.sites.flatMap((s) => s.boards.flatMap((b) => (b.photo?.kind === "remote" ? [new URL(b.photo.url).hostname] : []))))];
/** Pages the sitemap leaves out: thank-you pages, the 404 and the redirect pages. */
const unlisted = new Set(content.sites.flatMap((s) => servedRedirects(s).map((r) => `${url.origin}${base}${r.from}`)));

export default defineConfig({
  site: url.origin,
  base: base || undefined,
  output: "static",
  trailingSlash: "never",
  build: { format: "directory", inlineStylesheets: "auto" },
  image: { domains: photoHosts },
  integrations: [
    sitemap({ filter: (page) => !/\/(gracias|thank-you|404)\/?$/.test(page) && !unlisted.has(page.replace(/\/$/, "")) }),
    {
      name: "borda-redirects-file",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          if (content.redirects === "file") await writeFile(new URL("_redirects", dir), redirectsFile(content.sites, base));
        },
      },
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
