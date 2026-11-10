import { describe, expect, test } from "vitest";
import { checkContent } from "../scripts/gates/content.mjs";

type B = { slug: string; status: string; email?: string | null; [k: string]: unknown };
const b = (over: Partial<B> = {}): B => ({ slug: "ana", status: "published", email: "ana@studio.test", full_name: "Ana Torres", ...over });
const s = (boards: B[], over: Record<string, unknown> = {}, key = "main") => ({ key, prefix: "", boards, site: { name: "Studio", demo: false, ...over } });

describe("checkContent", () => {
  test("a site with published boards passes in every environment", () => {
    for (const BORDA_ENV of ["production", "development", undefined]) {
      const r = checkContent([s([b()])], { BORDA_ENV });
      expect(r.failures).toEqual([]);
      expect(r.boards).toBe(1);
    }
  });
  test("0 published boards fails a production build and only warns elsewhere; BORDA_ALLOW_EMPTY=1 publishes it", () => {
    const empty = [s([]), s([b({ status: "coming_soon" })], {}, "other")];
    const prod = checkContent(empty, { BORDA_ENV: "production" });
    expect(prod.failures).toHaveLength(2);
    expect(prod.failures[0]).toMatch(/^main: 0 published boards \(0 in the site\)/);
    expect(prod.failures[1]).toMatch(/^other: 0 published boards \(1 in the site\)/);
    expect(checkContent(empty, {}).failures).toEqual([]);
    expect(checkContent(empty, {}).warnings.filter((w: string) => w.includes("0 published"))).toHaveLength(2);
    expect(checkContent([s([])], { BORDA_ENV: "production", BORDA_ALLOW_EMPTY: "1" }).failures).toEqual([]);
  });
  test("duplicate slug, missing email and template leftovers fail", () => {
    const r = checkContent([s([b(), b({ email: null }), b({ slug: "x", full_name: "Lorem ipsum" }), b({ slug: "y", email: "y@example.com" }), b({ slug: "z", phone_e164: "+13125550142" })])], {});
    expect(r.failures.some((f: string) => f.includes("duplicate board slug ana"))).toBe(true);
    expect(r.failures.some((f: string) => f.includes("a published board needs an email"))).toBe(true);
    expect(r.failures.filter((f: string) => f.includes("template leftover"))).toHaveLength(3);
  });
  test("demo content builds with a warning, and a production build refuses it", () => {
    const demo = [s([b({ email: "alex@example.com" })], { demo: true })];
    expect(checkContent(demo, {}).failures).toEqual([]);
    expect(checkContent(demo, {}).warnings[0]).toMatch(/demo content/);
    expect(checkContent(demo, { BORDA_ENV: "production" }).failures[0]).toMatch(/demo content/);
  });
  test("a production lead form must post over https", () => {
    const site = [s([b()], { form: { action: "http://forms.studio.test/card" } })];
    expect(checkContent(site, {}).failures).toEqual([]);
    expect(checkContent(site, { BORDA_ENV: "production" }).failures[0]).toMatch(/post over https/);
  });
});
