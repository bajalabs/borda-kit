/**
 * src/brand: the brand-shaped part of the kit. Edit this file, tokens.css and the files under public/brand/;
 * the content (names, titles, links) lives in content/. Everything brand-shaped the pages render comes from here.
 */
export const brand = {
  /** Copy overrides per language (any key of src/i18n Dict): the register (usted or tú), wording, the error reasons. */
  copy: {} as { es?: Partial<import("../i18n/index.ts").Dict>; en?: Partial<import("../i18n/index.ts").Dict> },
  /** Default theme for pages that set none (one of the themes in src/styles/global.css). */
  theme: "navy",
  /** The mark on the card's band and the favicon, as paths under public/. */
  markWhite: "/brand/logo-white.svg",
  favicon: "/brand/favicon.svg",
  /** Web fonts the layout declares (@font-face) and preloads, files under public/brand/fonts/; the first is --font-sans in tokens.css. */
  fonts: [{ family: "InterVariable", url: "/brand/fonts/InterVariable.woff2", weight: "100 900", style: "normal" }],
  /** The social card (1200×630): gradient, the typeface satori draws with (TTF, OTF or WOFF under public/, not WOFF2), an optional mark. */
  og: {
    from: "#14213d",
    to: "#2f4b7c",
    text: "#ffffff",
    fontFamily: "Inter",
    fontFile: "public/brand/fonts/Inter-Bold.ttf",
    fontWeight: 700 as const,
    mark: "public/brand/logo-white.svg" as string | null,
  },
} as const;
