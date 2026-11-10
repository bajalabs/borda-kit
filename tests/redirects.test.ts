import { expect, test } from "vitest";
import { redirectsFile, servedRedirects } from "../src/borda/redirects.ts";

const primary = { prefix: "", site: { redirects: [{ from: "/alex", to: "/alex-rivera", status: 301 }] } };
const spanish = { prefix: "/es", site: { redirects: [{ from: "/tienda", to: "https://shop.test.invalid/es", status: 302 }] } };

test("a secondary site's redirects are served under its language; external targets are kept", () => {
  expect(servedRedirects(primary)).toEqual([{ from: "/alex", to: "/alex-rivera", status: 301 }]);
  expect(servedRedirects(spanish)).toEqual([{ from: "/es/tienda", to: "https://shop.test.invalid/es", status: 302 }]);
});

test("the _redirects file carries the base path on site paths only", () => {
  expect(redirectsFile([primary, spanish])).toBe("/alex /alex-rivera 301\n/es/tienda https://shop.test.invalid/es 302\n");
  expect(redirectsFile([primary, spanish], "/kit")).toBe("/kit/alex /kit/alex-rivera 301\n/kit/es/tienda https://shop.test.invalid/es 302\n");
  expect(redirectsFile([])).toBe("");
});
