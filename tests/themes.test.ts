import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { contrast, over, parseColor } from "../src/borda/contrast.ts";
import { THEMES } from "../src/borda/schema.ts";

const css = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const declarations = (body: string) => Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], (m[2] ?? "").trim()]));
const tokens = declarations(css("../src/brand/tokens.css"));
const themes = Object.fromEntries([...css("../src/styles/global.css").matchAll(/\[data-theme="(\w+)"\]\s*\{([^}]*)\}/g)].map((m) => [m[1], declarations(m[2] ?? "")]));

/** A theme variable as a colour: var(--token) resolves through tokens.css. */
function color(theme: string, name: string) {
  let value = themes[theme]?.[name] ?? "";
  for (let i = 0; i < 3 && value.startsWith("var("); i++) value = tokens[value.slice(4, -1)] ?? themes[theme]?.[value.slice(4, -1)] ?? "";
  const rgb = parseColor(value);
  if (!rgb) throw new Error(`${theme} ${name}: cannot read ${value}`);
  return rgb;
}

test("every theme the schema accepts is defined in global.css", () => {
  expect(Object.keys(themes).sort()).toEqual(THEMES.filter((t) => t !== "default").sort());
});

describe.each(Object.keys(themes))("the %s theme reads at 4.5:1 or better", (theme) => {
  const accent = color(theme, "--accent");
  const card = color(theme, "--card");
  test("button text on the accent", () => expect(contrast(color(theme, "--on-accent"), accent)).toBeGreaterThanOrEqual(4.5));
  test("accent text on the card, and on a ghost button (the accent at 12% over the card)", () => {
    expect(contrast(accent, card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent, over(accent, 0.12, card))).toBeGreaterThanOrEqual(4.5);
  });
  test("card text and muted card text", () => {
    expect(contrast(color(theme, "--card-ink"), card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color(theme, "--card-muted"), card)).toBeGreaterThanOrEqual(4.5);
  });
  test("page text on the page", () => expect(contrast(color(theme, "--ink"), color(theme, "--surface"))).toBeGreaterThanOrEqual(4.5));
});

test("the colour reader knows hex and oklch", () => {
  expect(parseColor("#fff")).toEqual([1, 1, 1]);
  expect(contrast(parseColor("#000000") as never, parseColor("#ffffff") as never)).toBeCloseTo(21, 5);
  expect(parseColor("oklch(1 0 0)")?.map((x) => Math.round(x * 255))).toEqual([255, 255, 255]);
  expect(parseColor("red")).toBeNull();
});
