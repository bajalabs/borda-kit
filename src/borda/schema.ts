/**
 * The content schema: one `site.json` per site and one `<slug>.json` per board (card), validated with Zod.
 * `pnpm schema` writes the same shapes as JSON Schema to `schema/`, so editors can check a file while it is typed.
 * Erasable TypeScript: Node scripts import this file directly.
 */
import { z } from "zod";

/** A site key or a board slug: lowercase letters and digits in words joined by single hyphens. */
export const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const E164 = /^\+[1-9][0-9]{6,14}$/;
export const THEMES = ["default", "navy", "charcoal", "sand", "forest", "ink"] as const;

const e164 = z.string().regex(E164, "use E.164, for example +13125550142");
const httpUrl = z.url({ protocol: /^https?$/, message: "use an http(s) URL" });
const httpsUrl = z.url({ protocol: /^https$/, message: "use an https URL" });
/** A CSS colour that is safe inside a style attribute: hex, or an rgb/hsl/oklch/oklab function with numbers only. */
const color = z
  .string()
  .regex(/^(#[0-9a-fA-F]{3,8}|(rgb|rgba|hsl|hsla|oklch|oklab)\([0-9.,%\s/+-]+\))$/, "use a hex colour or an rgb()/hsl()/oklch() value");
const schemaRef = z.string().optional().describe("The JSON Schema this file follows (for editors).");

const LinkSchema = z.strictObject({
  label: z.string().min(1),
  href: z.string().regex(/^(https?:\/\/|mailto:|tel:|\/(?!\/))/, "use an http(s), mailto: or tel: link, or a site path"),
});

export const PhotoSchema = z.strictObject({
  src: z.string().min(1).describe("A file under content/ (for example media/alex-rivera.jpg) or an https URL."),
  alt: z.string().nullable().optional().describe("Alternative text; the board's name when left out."),
  focal: z
    .strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
    .nullable()
    .optional()
    .describe("The point to keep in view when the photo is cropped, from 0 to 1 on each axis."),
  width: z.number().int().positive().optional().describe("Remote photos only: the pixel width."),
  height: z.number().int().positive().optional().describe("Remote photos only: the pixel height."),
  credit: z.string().nullable().optional(),
});

export const BoardSchema = z.strictObject({
  $schema: schemaRef,
  id: z.uuid().optional().describe("A stable id for the vCard UID; the card's URL is used when left out."),
  full_name: z.string().min(1),
  title: z.string().nullable().optional().describe("The role line under the name."),
  tagline: z.string().nullable().optional(),
  credentials: z.array(z.string().min(1)).default([]),
  bio_md: z.string().nullable().optional().describe("Markdown: paragraphs, **bold**, *italic*, links and lists."),
  email: z.email().nullable().optional().describe("Required for a published board: the vCard carries it."),
  phone_e164: e164.nullable().optional(),
  whatsapp_e164: e164.nullable().optional(),
  linkedin_url: httpsUrl.nullable().optional(),
  photo: PhotoSchema.nullable().optional(),
  theme: z.enum(THEMES).default("default").describe("One of the themes in src/styles/global.css; default uses the site's."),
  accent: color.nullable().optional(),
  hours: z.string().nullable().optional(),
  links: z.array(LinkSchema).default([]).describe("Link cards under the bio."),
  ctas: z.array(LinkSchema).default([]).describe("Full-width buttons under the contact actions."),
  socials: z.array(z.strictObject({ network: z.string().min(1), url: httpUrl, label: z.string().nullable().optional() })).default([]),
  org: z.string().min(1).optional().describe("The vCard ORG; the site's name when left out."),
  status: z.enum(["draft", "published", "coming_soon"]).default("published"),
  sort: z.number().int().default(0),
});

export const RedirectSchema = z.strictObject({
  from: z.string().regex(/^\/[a-z0-9/_-]*$/, "a site path such as /old-slug"),
  to: z.string().regex(/^(https?:\/\/|\/(?!\/))/, "a site path or an http(s) URL"),
  status: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).default(301),
});

export const SiteSchema = z.strictObject({
  $schema: schemaRef,
  primary: z.boolean().default(false).describe("The site served at /; other sites are served under /<language>/."),
  demo: z.boolean().default(false).describe("Demo content: never indexed, and refused by a production build."),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, "a locale such as en-US or es-MX"),
  name: z.string().min(1).describe("The brand or organisation name."),
  domain: z.string().min(1).describe("The website's host as shown on the cards, for example example.com."),
  boards_domain: z.string().regex(/^[a-z0-9.-]+$/, "a host name such as boards.example.com"),
  website_url: httpUrl,
  theme: z.enum(THEMES).default("default"),
  privacy_url: httpsUrl.nullable().optional().describe("Linked from the lead form's consent."),
  form: z
    .strictObject({
      action: httpUrl.describe("Where the lead form posts (see content/README.md, Lead form)."),
      turnstile_site_key: z.string().nullable().optional().describe("Adds a Cloudflare Turnstile challenge when set."),
      consent_version: z.string().max(80).nullable().optional(),
    })
    .nullable()
    .optional(),
  redirects: z.array(RedirectSchema).default([]),
});

export type Site = z.infer<typeof SiteSchema>;
export type BoardInput = z.infer<typeof BoardSchema>;
export type Redirect = z.infer<typeof RedirectSchema>;

/** A photo after loading: a file under content/ (with its digest) or a remote URL. */
export type ResolvedPhoto =
  | { kind: "local"; path: string; sha256: string; alt: string | null; focal: { x: number; y: number } | null; credit: string | null }
  | { kind: "remote"; url: string; width: number | null; height: number | null; alt: string | null; focal: { x: number; y: number } | null; credit: string | null };

export type Board = Omit<BoardInput, "photo" | "$schema"> & { slug: string; photo: ResolvedPhoto | null };

/** One site as the pages read it: the validated site file, its boards, and where it is mounted. */
export interface Bundle {
  key: string;
  prefix: string;
  content_sha256: string;
  site: Omit<Site, "$schema">;
  boards: Board[];
}

/** What `scripts/borda-load.mjs` writes to `.borda/content.json`. */
export interface Content {
  url: string;
  redirects: "html" | "file";
  noindex: boolean;
  sites: Bundle[];
}

export function formatIssues(error: z.ZodError): string[] {
  return error.issues.slice(0, 12).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
}
