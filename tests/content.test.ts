import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { ContentError, loadContent, siteUrl } from "../src/borda/content.ts";
import { board, contentDir, site } from "./helpers.ts";

const problems = (root: string, env: Record<string, string> = {}) => {
  try {
    loadContent(root, env);
  } catch (e) {
    if (e instanceof ContentError) return e.problems;
    throw e;
  }
  return [];
};

describe("the demo content", () => {
  const demo = loadContent(fileURLToPath(new URL("../content/", import.meta.url)), {});
  test("loads: two demo sites, English at / and Spanish at /es, three boards each", () => {
    expect(demo.sites.map((s) => [s.key, s.prefix, s.boards.length])).toEqual([["demo-en", "", 3], ["demo-es", "/es", 3]]);
    expect(demo.url).toBe("https://boards.example.com");
    expect(demo.noindex).toBe(true);
    expect(demo.redirects).toBe("html");
  });
  test("photos are files under content/ with their digest; boards are ordered by sort", () => {
    const en = demo.sites[0];
    expect(en?.boards.map((b) => b.slug)).toEqual(["alex-rivera", "sam-okafor", "mina-castillo"]);
    expect(en?.boards[0]?.photo).toMatchObject({ kind: "local", path: "media/alex-rivera.jpg" });
    expect(en?.boards[0]?.photo?.kind === "local" && en.boards[0].photo.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(en?.boards[2]?.photo).toBeNull();
  });
});

describe("validation", () => {
  test("every problem is reported at once, with the file it came from", () => {
    const root = contentDir({
      "a/site.json": site({ primary: true, theme: "neon" }),
      "a/boards/Bad_Slug.json": board(),
      "a/boards/ok.json": board({ phone_e164: "555-0100", colour: "red" }),
      "b/site.json": "{ not json",
    });
    const p = problems(root);
    expect(p.some((x) => x.startsWith("content/a/site.json: theme"))).toBe(true);
    expect(p.some((x) => x.startsWith("content/a/boards/Bad_Slug.json: the file name is the slug"))).toBe(true);
    expect(p.some((x) => x.startsWith("content/a/boards/ok.json: phone_e164: use E.164"))).toBe(true);
    expect(p.some((x) => x.includes("content/a/boards/ok.json") && x.includes("colour"))).toBe(true); // unknown keys are refused
    expect(p.some((x) => x.startsWith("content/b/site.json:"))).toBe(true);
  });
  test("a photo must be a file under content/ with a supported extension, or an https URL", () => {
    const root = contentDir({
      "a/site.json": site(),
      "a/boards/one.json": board({ photo: { src: "media/missing.jpg" } }),
      "a/boards/two.json": board({ photo: { src: "../outside.jpg" } }),
      "a/boards/three.json": board({ photo: { src: "media/logo.gif" } }),
      "a/boards/four.json": board({ photo: { src: "http://cdn.test.invalid/p.jpg" } }),
      "a/boards/five.json": board({ photo: { src: "https://cdn.test.invalid/p.jpg", width: 800, height: 600 } }),
      "media/logo.gif": "GIF89a",
    });
    const p = problems(root);
    expect(p).toContain("content/a/boards/one.json: photo media/missing.jpg is not in content/");
    expect(p).toContain("content/a/boards/two.json: photo.src ../outside.jpg points outside content/");
    expect(p.some((x) => x.startsWith("content/a/boards/three.json: photo.src media/logo.gif must be one of"))).toBe(true);
    expect(p).toContain("content/a/boards/four.json: photo.src must be a path under content/ or an https URL");
    expect(p.some((x) => x.includes("five.json"))).toBe(false);
  });
  test("an accent must be a plain colour, so it cannot inject CSS", () => {
    const root = contentDir({ "a/site.json": site(), "a/boards/one.json": board({ accent: "red;background:url(x)" }) });
    expect(problems(root).some((x) => x.startsWith("content/a/boards/one.json: accent"))).toBe(true);
  });
  test("drafts are left out unless BORDA_DRAFTS=1", () => {
    const root = contentDir({ "a/site.json": site(), "a/boards/one.json": board(), "a/boards/two.json": board({ status: "draft" }) });
    expect(loadContent(root, {}).sites[0]?.boards.map((b) => b.slug)).toEqual(["one"]);
    expect(loadContent(root, { BORDA_DRAFTS: "1" }).sites[0]?.boards.map((b) => b.slug)).toEqual(["one", "two"]);
  });
});

describe("sites", () => {
  const two = () =>
    contentDir({
      "en/site.json": site({ primary: true }),
      "en/boards/ana.json": board(),
      "es/site.json": site({ locale: "es-MX" }),
      "es/boards/ana.json": board(),
    });
  test("the site marked primary is at /, the others under their language", () => {
    expect(loadContent(two(), {}).sites.map((s) => [s.key, s.prefix])).toEqual([["en", ""], ["es", "/es"]]);
  });
  test("BORDA_SITES picks the sites and the first one is the primary", () => {
    expect(loadContent(two(), { BORDA_SITES: "es" }).sites.map((s) => [s.key, s.prefix])).toEqual([["es", ""]]);
    expect(loadContent(two(), { BORDA_SITES: "es,en" }).sites.map((s) => [s.key, s.prefix])).toEqual([["es", ""], ["en", "/en"]]);
    expect(problems(two(), { BORDA_SITES: "fr" })[0]).toBe("BORDA_SITES names fr, but content/fr/site.json does not exist");
  });
  test("two sites without a primary, two in one language, and a slug that hides a language path are refused", () => {
    const noPrimary = contentDir({ "a/site.json": site(), "b/site.json": site({ locale: "es-MX" }) });
    expect(problems(noPrimary)[0]).toMatch(/none has "primary": true/);
    const sameLang = contentDir({ "a/site.json": site({ primary: true }), "b/site.json": site({ locale: "es-MX" }), "c/site.json": site({ locale: "es-ES" }) });
    expect(problems(sameLang)).toContain("content/c: another site already uses /es; one site per language");
    const clash = contentDir({ "a/site.json": site({ primary: true }), "a/boards/es.json": board(), "b/site.json": site({ locale: "es-MX" }) });
    expect(problems(clash)).toContain("content/a/boards/es.json: the slug collides with b's /es/ path");
  });
  test("a redirect may not hide a board", () => {
    const root = contentDir({ "a/site.json": site({ redirects: [{ from: "/ana", to: "/" }] }), "a/boards/ana.json": board() });
    expect(problems(root)).toContain("content/a/site.json: the redirect from /ana would hide the board ana");
  });
  test("no site at all is a clear error", () => {
    expect(problems(contentDir({ "README.md": "hello" }))[0]).toMatch(/^no site found/);
  });
});

describe("settings", () => {
  const one = () => contentDir({ "a/site.json": site(), "a/boards/ana.json": board() });
  test("the site URL is https://<boards_domain> unless BORDA_SITE_URL says otherwise; a base path is kept", () => {
    expect(loadContent(one(), {}).url).toBe("https://boards.test.invalid");
    expect(loadContent(one(), { BORDA_SITE_URL: "https://example.github.io/borda-kit/" }).url).toBe("https://example.github.io/borda-kit");
    expect(siteUrl("x.invalid", "http://localhost:4335")).toBe("http://localhost:4335");
    expect(() => siteUrl("x.invalid", "ftp://x.invalid")).toThrow(ContentError);
    expect(() => siteUrl("x.invalid", "https://x.invalid/?a=1")).toThrow(ContentError);
  });
  test("BORDA_REDIRECTS is html or file, BORDA_NOINDEX=1 asks crawlers to stay out", () => {
    expect(loadContent(one(), { BORDA_REDIRECTS: "file" }).redirects).toBe("file");
    expect(() => loadContent(one(), { BORDA_REDIRECTS: "meta" })).toThrow(/html or file/);
    expect(loadContent(one(), {}).noindex).toBe(false);
    expect(loadContent(one(), { BORDA_NOINDEX: "1" }).noindex).toBe(true);
  });
});
