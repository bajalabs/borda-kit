import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { consentParts } from "../src/borda/consent.ts";
import { dict } from "../src/i18n/index.ts";

test("the notice's words inside the consent become the link, in both languages", () => {
  for (const [locale, url] of [["es-MX", "https://example.com/es/privacidad"], ["en-US", "https://example.com/privacy"]] as const) {
    const t = dict(locale);
    const p = consentParts(t.consent, t.privacyNotice, url);
    expect(p.link).toBe(t.privacyNotice);
    expect(p.before + p.link + p.after).toBe(t.consent);
  }
});

test("without a privacy URL the consent is plain text", () => {
  const t = dict("es-MX");
  expect(consentParts(t.consent, t.privacyNotice, null)).toEqual({ before: t.consent, link: null, after: "" });
  expect(consentParts(t.consent, t.privacyNotice, undefined).link).toBeNull();
});

test("a consent that does not contain the notice's words gets the link after it", () => {
  expect(consentParts("I agree to be contacted.", "privacy notice", "https://example.com/privacy")).toEqual({ before: "I agree to be contacted. ", link: "privacy notice", after: "" });
});

test("the lead form renders the link only with the URL, opening apart so the form is not lost", () => {
  const src = readFileSync(new URL("../src/components/LeadForm.astro", import.meta.url), "utf8");
  expect(src).toMatch(/consentParts\(t\.consent, t\.privacyNotice, privacyUrl\)/);
  expect(src).toMatch(/<a class="underline" href=\{privacyUrl\} target="_blank" rel="noopener">\{consent\.link\}<\/a>/);
});
