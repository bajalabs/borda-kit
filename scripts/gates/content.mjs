#!/usr/bin/env node
/**
 * Content gate on .borda/content.json, after the schema: what a schema cannot say about a site that is about to ship.
 *
 *   - a published board has an email (the vCard carries EMAIL), and slugs are unique per site;
 *   - no template leftovers (lorem ipsum, TODO, example.com addresses, 555-01xx numbers) outside a site marked "demo";
 *   - BORDA_ENV=production refuses demo sites, leftovers, a form that does not post over https, and a site with
 *     0 published boards (BORDA_ALLOW_EMPTY=1 publishes an empty site on purpose).
 */
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const LEFTOVERS = /\b(lorem ipsum|TODO|FIXME|Jane Doe|John Doe)\b|\bexample\.(com|org|net)\b|\+1\d{3}55501\d{2}\b/i;

/** @returns {{ failures: string[], warnings: string[], boards: number }} */
export function checkContent(sites, env = process.env) {
  const failures = [];
  const warnings = [];
  const production = env.BORDA_ENV === "production";
  for (const s of sites) {
    if (s.site.demo) {
      const msg = `${s.key}: demo content (site.json has "demo": true); replace it with your own before publishing`;
      if (production) failures.push(msg);
      else warnings.push(msg);
    }
    const seen = new Set();
    for (const board of s.boards) {
      if (seen.has(board.slug)) failures.push(`${s.key}: duplicate board slug ${board.slug}`);
      seen.add(board.slug);
      if (board.status === "published" && !board.email) failures.push(`${s.key}/${board.slug}: a published board needs an email (the vCard carries EMAIL)`);
      const text = JSON.stringify(board);
      const hit = text.match(LEFTOVERS)?.[0];
      if (hit && !s.site.demo && env.BORDA_ALLOW_LEFTOVERS !== "1") failures.push(`${s.key}/${board.slug}: template leftover (${hit})`);
    }
    const siteHit = JSON.stringify(s.site).match(LEFTOVERS)?.[0];
    if (siteHit && !s.site.demo && env.BORDA_ALLOW_LEFTOVERS !== "1") failures.push(`${s.key}: template leftover in site.json (${siteHit})`);
    const published = s.boards.filter((b) => b.status === "published").length;
    if (published === 0) {
      const msg = `${s.key}: 0 published boards (${s.boards.length} in the site); the site would publish empty`;
      if (production && env.BORDA_ALLOW_EMPTY !== "1") failures.push(`${msg}; set BORDA_ALLOW_EMPTY=1 to publish an empty site on purpose`);
      else warnings.push(msg);
    }
    if (production && s.site.form && !/^https:\/\//.test(s.site.form.action)) failures.push(`${s.key}: the lead form must post over https in production`);
  }
  return { failures, warnings, boards: sites.reduce((n, s) => n + s.boards.length, 0) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { sites } = JSON.parse(await readFile(new URL("../../.borda/content.json", import.meta.url), "utf8"));
  const { failures, warnings, boards } = checkContent(sites);
  for (const w of warnings) console.warn(`gates:content: ${w}`);
  if (failures.length) {
    console.error(`✗ gates:content\n  ${failures.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`✓ gates:content: ${boards} boards across ${sites.length} site(s)`);
}
