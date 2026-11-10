import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const site = (over: Record<string, unknown> = {}) => ({
  locale: "en-US",
  name: "Test Co",
  domain: "test.invalid",
  boards_domain: "boards.test.invalid",
  website_url: "https://test.invalid",
  ...over,
});
export const board = (over: Record<string, unknown> = {}) => ({ full_name: "Ana Torres", email: "ana@test.invalid", ...over });

/** A content folder in a temporary directory: { "<site>/site.json": {...}, "<site>/boards/<slug>.json": {...}, "media/x.jpg": "bytes" }. */
export function contentDir(files: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), "borda-content-"));
  for (const [path, value] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value));
  }
  return root;
}
