/** The content schema as JSON Schema (draft 2020-12) for editors; `pnpm schema` writes it, a test keeps it in step. */
import { z } from "zod";
import { BoardSchema, SiteSchema } from "./schema.ts";

export function jsonSchemas(): Record<"site" | "board", Record<string, unknown>> {
  const base = "https://raw.githubusercontent.com/bajalabs/borda-kit/main/schema";
  const make = (name: string, title: string, schema: z.ZodType) => ({
    ...z.toJSONSchema(schema, { io: "input", target: "draft-2020-12" }),
    $id: `${base}/${name}.schema.json`,
    title,
  });
  return {
    site: make("site", "borda-kit site (content/<site>/site.json)", SiteSchema),
    board: make("board", "borda-kit board (content/<site>/boards/<slug>.json)", BoardSchema),
  };
}
