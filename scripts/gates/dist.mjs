#!/usr/bin/env node
/**
 * Output gate on the built site: every board has its page, vCard, QR (SVG and PNG) and OG image; head sanity
 * (lang, canonical on the site URL, one h1); a responsive photo; no leftovers or secret-looking strings.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dist = join(root, "dist");
const { url, sites } = JSON.parse(await readFile(join(root, ".borda/content.json"), "utf8"));
const failures = [];
const canonical = new RegExp(`<link rel="canonical" href="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`);
let checked = 0;
for (const s of sites) {
  for (const board of s.boards) {
    const dir = join(dist, `${s.prefix}/${board.slug}`);
    const files = ["index.html", "qr.svg", "qr.png", "og.jpg", ...(board.email ? ["contact.vcf"] : [])];
    for (const f of files) if (!existsSync(join(dir, f))) failures.push(`${s.key}/${board.slug}: missing ${f}`);
    if (existsSync(join(dir, "index.html"))) {
      const html = await readFile(join(dir, "index.html"), "utf8");
      if (!/<html[^>]*\slang="/.test(html)) failures.push(`${board.slug}: <html lang> missing`);
      if (!canonical.test(html)) failures.push(`${board.slug}: canonical missing or not on ${url}`);
      if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) failures.push(`${board.slug}: expected one <h1>`);
      if (/lorem ipsum|TODO|FIXME/i.test(html)) failures.push(`${board.slug}: leftover text`);
      if (/sk_live|service_role|eyJhbGci|-----BEGIN [A-Z ]*PRIVATE KEY/.test(html)) failures.push(`${board.slug}: a secret-looking string in the HTML`);
      if (board.photo && !/<img[^>]+srcset="[^"]*\b\d+w\b/.test(html)) failures.push(`${board.slug}: the photo has no srcset (a remote photo's host must be in image.domains)`);
    }
    if (existsSync(join(dir, "contact.vcf"))) {
      const v = await readFile(join(dir, "contact.vcf"), "utf8");
      if (!/^BEGIN:VCARD\r\nVERSION:4\.0/.test(v) || !/\nEMAIL/.test(v)) failures.push(`${board.slug}: vCard malformed or without EMAIL`);
    }
    checked++;
  }
}
for (const f of ["index.html", "404.html", ".well-known/borda-build.json", "robots.txt", "sitemap-index.xml"]) if (!existsSync(join(dist, f))) failures.push(`missing ${f}`);
if (failures.length) {
  console.error(`✗ gates:dist\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ gates:dist: ${checked} board(s): every page, vCard, QR (SVG and PNG) and OG image is in dist/`);
