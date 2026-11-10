# Changelog

All notable changes to this project are written here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.1] - 2026-11-10

### Security

- `sharp` 0.35.5 (librsvg CVE-2026-96889), `zod` 4.6.6 (memory exhaustion on oversized constrained input), `satori` 0.33.5 (improper escaping in generated SVG), and an override to `fflate` 0.7.5, which satori pins at 0.7.3.

## [1.0.0] - 2026-11-10

### Added

- Boards from local content: `content/<site>/site.json` and `content/<site>/boards/<slug>.json`, validated with Zod, with JSON Schema files for editors (`schema/`).
- Per board: the card page, vCard 4.0 (`contact.vcf`), QR codes (SVG, and PNG at 1024 px), and a 1200 × 630 social image with the photo.
- Local photos optimised at build time, remote photos with known hosts, focal points, initials when there is no photo.
- Markdown bios (a safe subset), credentials, link cards, call-to-action buttons, social icons, opening hours.
- An optional lead form with a honeypot, a consent linked to the privacy notice, optional Cloudflare Turnstile, and in-place answers with JavaScript.
- English and Spanish copy; a second site in another language served under `/<language>/`.
- Five themes held to 4.5:1 contrast by a test; brand tokens, fonts, marks and social-card look in `src/brand/`.
- Static output for any host; redirects as pages or as a `_redirects` file; a base path for project sites (`BORDA_SITE_URL`).
- Build gates: content (leftovers, demo content in production, empty sites), output (every file per board, head sanity, responsive photos) and redirects.
- A fictional demo brand with three boards in two languages.

[Unreleased]: https://github.com/bajalabs/borda-kit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/bajalabs/borda-kit/releases/tag/v1.0.0
