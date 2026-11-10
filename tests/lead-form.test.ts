import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const src = readFileSync(new URL("../src/components/LeadForm.astro", import.meta.url), "utf8");

test("only the email and the consent are required on the lead form", () => {
  const required = [...src.matchAll(/<(?:input|textarea|select)\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /\srequired(?=[\s/>])/.test(tag))
    .map((tag) => tag.match(/name="([^"]+)"/)?.[1] ?? "(unnamed)");
  expect(required.sort()).toEqual(["consent", "email"]);
});

test("the form posts the board, a honeypot and the consent, and loads Turnstile only when a site key is set", () => {
  for (const name of ["board", "site", "locale", "page", "_hp", "consent"]) expect(src).toContain(`name="${name}"`);
  expect(src).toMatch(/\{siteKey && <div class="cf-turnstile"/);
  expect(src).toMatch(/function token\(\) \{ if \(!el\) return 'none';/);
});
