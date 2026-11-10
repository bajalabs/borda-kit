import type { APIRoute, GetStaticPaths } from "astro";
import { entries, origin } from "../../borda/bundle.ts";
import { buildVCard } from "../../borda/vcard.ts";
export const getStaticPaths = (() => entries.filter((e) => e.board.email).map((e) => ({ params: { path: e.path.slice(1) }, props: { e } }))) satisfies GetStaticPaths;
export const GET: APIRoute = ({ props }) => {
  const { e } = props as { e: (typeof entries)[number] };
  const v = buildVCard({
    uid: e.board.id ? `urn:uuid:${e.board.id}` : `${origin}${e.path}`,
    fullName: e.board.full_name,
    title: e.board.title,
    email: e.board.email as string,
    phone: e.board.phone_e164,
    whatsapp: e.board.whatsapp_e164,
    linkedin: e.board.linkedin_url,
    org: e.board.org ?? e.bundle.site.name,
    website: e.bundle.site.website_url,
    source: `${origin}${e.path}/contact.vcf`,
  });
  return new Response(v, { headers: { "content-type": "text/vcard; charset=utf-8" } });
};
