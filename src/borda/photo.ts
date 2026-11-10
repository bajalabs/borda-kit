/**
 * Responsive attributes for a media record shown in a square of `px` CSS pixels (the card's 112 px portrait, the index's 56 px thumbnail).
 * Width variants at 1×, 2× and 3× follow the image's own ratio, so the shorter side fills the square on a 3× screen without upscaling;
 * `sizes` is the square; the focal point becomes object-position, since the crop stays in CSS (Astro's sharp service passes `position`
 * to sharp, which takes gravity names, not percentages). Erasable TypeScript: the tests import it directly.
 */
export interface PhotoLike { width: number | null; height: number | null; focal?: { x: number | null; y: number | null } | null }

export function photoAttrs(m: PhotoLike, px: number) {
  const ratio = m.width && m.height ? m.width / m.height : null;
  const base = Math.round(px * 3 * Math.max(1, ratio ?? 1));
  const widths = [1, 2, 3].map((d) => Math.round((base * d) / 3));
  const focal = m.focal && m.focal.x != null && m.focal.y != null ? `${Math.round(m.focal.x * 100)}% ${Math.round(m.focal.y * 100)}%` : null;
  return { known: ratio !== null, width: base, height: ratio ? Math.round(base / ratio) : base, widths, sizes: `${px}px`, position: focal };
}
