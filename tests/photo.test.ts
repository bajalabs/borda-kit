import { expect, test } from "vitest";
import { photoAttrs } from "../src/borda/photo.ts";

test("a landscape photo gets variants wide enough for the 3× square and its focal point as object-position", () => {
  const a = photoAttrs({ width: 2048, height: 1376, focal: { x: 0.5, y: 0.35 } }, 112);
  expect(a.known).toBe(true);
  expect(a.widths).toEqual([167, 333, 500]);
  expect([a.width, a.height, a.sizes, a.position]).toEqual([500, 336, "112px", "50% 35%"]);
});

test("a portrait photo keeps 1×, 2×, 3× of the square; unknown dimensions fall back to a square with no position", () => {
  const p = photoAttrs({ width: 800, height: 1000, focal: null }, 56);
  expect(p.widths).toEqual([56, 112, 168]);
  expect(p.height).toBe(210);
  expect(p.position).toBeNull();
  const u = photoAttrs({ width: null, height: null, focal: { x: null, y: 0.2 } }, 112);
  expect([u.known, u.width, u.height, u.position]).toEqual([false, 336, 336, null]);
});
