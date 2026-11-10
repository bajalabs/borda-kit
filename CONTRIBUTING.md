# Contributing

Thank you for helping. This is a template: changes should help every brand that starts from it, so brand-specific content, colours or copy belong in your own copy, not here.

## Set up

```sh
corepack enable          # pnpm at the version in package.json
pnpm install
pnpm dev                 # http://localhost:4335
```

Use pnpm only (not npm or yarn): the lockfile is `pnpm-lock.yaml`.

## Before you open a pull request

```sh
pnpm lint                # Biome
pnpm type-check          # astro check
pnpm test                # vitest
pnpm build               # the full build with its gates
```

CI runs the same commands on every pull request, plus a base-path build and a Lighthouse check on the demo.

- A change to `src/borda/schema.ts` needs `pnpm schema` and the regenerated files in `schema/` (a test compares them).
- A change to the themes or tokens must keep `tests/themes.test.ts` green (4.5:1 contrast).
- New behaviour comes with a test in `tests/`. Keep demo content fictional: `example.com` addresses, `555-01xx` phone numbers, generated images.
- Add a line under "Unreleased" in `CHANGELOG.md`.

## Proposing a change

Open an issue first for anything larger than a fix, so we can agree on the approach. Pull requests are reviewed against the checks above and merged once CI is green.

By contributing you agree that your contribution is licensed under the MIT License of this repository.
