import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { jsonSchemas } from "../src/borda/json-schema.ts";

test("schema/*.schema.json match the Zod schema (run `pnpm schema` after changing src/borda/schema.ts)", () => {
  for (const [name, schema] of Object.entries(jsonSchemas())) {
    const committed = JSON.parse(readFileSync(new URL(`../schema/${name}.schema.json`, import.meta.url), "utf8"));
    expect(committed).toEqual(JSON.parse(JSON.stringify(schema)));
  }
});

test("the JSON Schema refuses unknown keys and names the required ones", () => {
  const { site, board } = jsonSchemas();
  expect(board.additionalProperties).toBe(false);
  expect(board.required).toEqual(["full_name"]);
  expect(site.required).toEqual(expect.arrayContaining(["locale", "name", "domain", "boards_domain", "website_url"]));
});
