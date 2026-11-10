/**
 * A board's photo for <Image>: a file under content/ (imported, so Astro optimises it at build time) or a remote URL
 * (optimised when its host is in image.domains, which astro.config.mjs fills from the content).
 */
import type { ImageMetadata } from "astro";
import type { Board } from "./schema.ts";

const files = import.meta.glob<ImageMetadata>("/content/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}", { eager: true, import: "default" });

export interface Photo {
  src: ImageMetadata | string;
  width: number | null;
  height: number | null;
  alt: string | null;
  focal: { x: number | null; y: number | null } | null;
}

export function photoOf(board: Board): Photo | null {
  const p = board.photo;
  if (!p) return null;
  if (p.kind === "remote") return { src: p.url, width: p.width, height: p.height, alt: p.alt, focal: p.focal };
  const meta = files[`/content/${p.path}`];
  if (!meta) throw new Error(`photo content/${p.path} was not found by the image import (is the extension supported?)`);
  return { src: meta, width: meta.width, height: meta.height, alt: p.alt, focal: p.focal };
}
