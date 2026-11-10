#!/usr/bin/env node
/** Writes schema/site.schema.json and schema/board.schema.json from the Zod schema in src/borda/schema.ts (`pnpm schema`). */
import { writeFile } from "node:fs/promises";
import { jsonSchemas } from "../src/borda/json-schema.ts";

for (const [name, schema] of Object.entries(jsonSchemas())) {
  await writeFile(new URL(`../schema/${name}.schema.json`, import.meta.url), `${JSON.stringify(schema, null, 2)}\n`);
  console.log(`schema: wrote schema/${name}.schema.json`);
}
