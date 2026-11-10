/** The build receipt: which content shipped (sites, board counts, content digests) and when. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { APIRoute } from "astro";
const receipt = readFileSync(join(process.cwd(), ".borda/build.json"), "utf8"); // read at build time from the project root
export const GET: APIRoute = () => new Response(receipt, { headers: { "content-type": "application/json" } });
