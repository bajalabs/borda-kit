import { expect, test } from "vitest";
import { qrPng, qrSvg } from "../src/borda/qr.ts";

const pngWidth = (png: Uint8Array) => ((png[16] ?? 0) << 24) | ((png[17] ?? 0) << 16) | ((png[18] ?? 0) << 8) | (png[19] ?? 0);

test("the QR is a standalone SVG with one path and an escaped title", () => {
  const s = qrSvg("https://boards.example.com/alex-rivera", { color: "#111", title: 'Alex & "Co"' });
  expect(s).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+"/);
  expect(s.match(/<path /g)).toHaveLength(1);
  expect(s).toContain("<title>Alex &amp; &quot;Co&quot;</title>");
});

test("the QR PNG is 1024 px wide by default and takes a size", () => {
  const png = qrPng("https://boards.example.com/alex-rivera", { color: "#111", title: "Alex" });
  expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(pngWidth(png)).toBe(1024);
  expect(pngWidth(qrPng("https://boards.example.com/alex-rivera", { color: "#111", title: "Alex", size: 256 }))).toBe(256);
});
