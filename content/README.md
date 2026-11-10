# content/

Everything the boards show comes from this folder. Every file is checked against the schema in `src/borda/schema.ts` when you run `pnpm dev` or `pnpm build`; when anything is wrong, the run stops and lists every problem with the file it is in.

```
content/
  media/                 photos, referenced by path from the boards
    alex-rivera.jpg
  demo-en/               a site: any folder with a site.json
    site.json
    boards/              one file per board; the file name is the slug
      alex-rivera.json   → /alex-rivera
  demo-es/               a second site in another language → /es/alex-rivera
    site.json
    boards/…
```

The shipped content is a fictional demo (`"demo": true`): the people, the `example.com` addresses and the `555-01xx` phone numbers are invented, and the photos are generated placeholders. Replace it with your own; a production build (`BORDA_ENV=production`) refuses a demo site.

Editors that read JSON Schema (VS Code and most others) check each file as you type through its `$schema` line: `schema/site.schema.json` and `schema/board.schema.json`, generated from the Zod schema with `pnpm schema`.

## Sites: `<site>/site.json`

| Field | Required | What it is |
|---|---|---|
| `locale` | yes | `en-US`, `es-MX`… The copy of the pages follows its language (English and Spanish ship). |
| `name` | yes | The organisation, shown on every card, in titles and as the vCard `ORG`. |
| `domain` | yes | The website's host as shown on the cards (`example.com`). |
| `boards_domain` | yes | Where the boards are served (`boards.example.com`); the site URL is `https://<boards_domain>` unless `BORDA_SITE_URL` says otherwise. |
| `website_url` | yes | The website, linked from every card and written to the vCard. |
| `primary` | one site | `true` on the site served at `/`. Other sites are served under their language: `/es/…`. One site per language. |
| `demo` | no | `true` for demo content: never indexed, refused by `BORDA_ENV=production`. |
| `theme` | no | `default`, `navy`, `charcoal`, `sand`, `forest` or `ink` (see the README, Theming). |
| `privacy_url` | no | An https link to the privacy notice; the lead form's consent links it. |
| `form` | no | The lead form (below). Without it the cards have no form. |
| `redirects` | no | `[{ "from": "/old-slug", "to": "/new-slug", "status": 301 }]`. Paths are relative to the site (`/es` is added for a Spanish site); `to` may also be an http(s) URL. Keep a redirect when you rename a slug, so printed QR codes keep working. |

## Boards: `<site>/boards/<slug>.json`

The slug is the file name: lowercase words joined by hyphens.

| Field | What it is |
|---|---|
| `full_name` | Required. The name on the card and in the vCard (`FN`; `N` when it splits into two words). |
| `title`, `tagline` | The role line and one sentence under it. |
| `email` | Required for a published board: the vCard carries it. |
| `phone_e164`, `whatsapp_e164` | E.164 (`+13125550142`). They become the Call and WhatsApp actions and the vCard `TEL`. |
| `linkedin_url` | An https link; the LinkedIn action. |
| `photo` | `{ "src": "media/alex.jpg", "alt": "…", "focal": { "x": 0.5, "y": 0.4 } }`. `src` is a file under `content/` (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`), resized at build time, or an https URL (give `width` and `height`). `focal` keeps a point in view when the photo is cropped to a circle. Without a photo the card shows the initials. |
| `bio_md` | Markdown: paragraphs, `**bold**`, `*italic*`, `[links](https://…)`, `-` and `1.` lists. Raw HTML is shown as text. |
| `credentials` | Short labels shown as chips. |
| `links` | Link cards: `[{ "label": "Portfolio", "href": "https://…" }]` (http(s), `mailto:`, `tel:` or a site path). |
| `ctas` | Full-width buttons under the actions, same shape as `links`. |
| `socials` | `[{ "network": "instagram", "url": "https://…", "label": "@name" }]`; the icon comes from the network name, else the URL's host. |
| `hours` | A line of opening hours. |
| `theme`, `accent` | A theme for this board, and an accent colour (`#2f4b7c` or `oklch(0.5 0.13 135)`) with 4.5:1 contrast against white. |
| `org` | The vCard `ORG` when it differs from the site's name. |
| `id` | A UUID kept stable across builds; it becomes the vCard `UID` (the card's URL otherwise). |
| `status` | `published` (default), `coming_soon` (built, marked "Coming soon", not indexed) or `draft` (left out unless `BORDA_DRAFTS=1`). |
| `sort` | Order on the index; ties sort by slug. |

Every board gets `/<slug>` (the card), `/<slug>/contact.vcf` (vCard 4.0), `/<slug>/qr.svg` and `/<slug>/qr.png` (1024 px, for print) and `/<slug>/og.jpg` (the social preview).

## Lead form

With `form` set, each card ends with a contact form that posts to `form.action`:

| Field posted | Value |
|---|---|
| `board`, `site`, `locale`, `page` | The board's slug, the site folder, its locale and the card's path. |
| `name`, `email`, `phone`, `message` | What the visitor typed; only `email` is required. |
| `consent` | `on` (required); `consent_version` too when the site sets one. |
| `_hp` | A honeypot: drop the post when it is not empty. |
| `cf-turnstile-response` | Only when `form.turnstile_site_key` is set (Cloudflare Turnstile); verify it on the server. |

Your endpoint answers in one of two ways:

- **Without JavaScript** (a plain HTML post): `303 See Other` to the thank-you page, `/thank-you` (`/gracias` for Spanish), with `?n=<reference>` on success or `?error=1&code=<code>` on failure.
- **With JavaScript**, the card posts the same fields with `Accept: application/json` and shows the answer in place: `{ "ok": true, "number": "<reference>" }` or `{ "error": { "code": "<code>" } }`. The codes the pages have words for are `rate_limited`, `turnstile_failed`, `consent_required`, `invalid_body`, `unknown_site` and `form_closed`; any other code shows the generic error. Allow the boards' origin in the endpoint's CORS policy.

Any form backend that can do that works: your own API, a serverless function, or a hosted form service.
