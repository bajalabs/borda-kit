/**
 * WCAG contrast for the colour forms the kit's CSS uses (#hex and oklch()), so a test can hold every theme to 4.5:1.
 * Erasable TypeScript, no imports.
 */
type RGB = [number, number, number]; // sRGB, gamma-encoded, 0..1

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const encode = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** "#rgb", "#rrggbb" or "oklch(L C h)" (L as 0..1 or a percentage) to sRGB; null for anything else. */
export function parseColor(value: string): RGB | null {
  const v = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255) as RGB;
  }
  const m = /^oklch\(\s*([0-9.]+)(%?)\s+([0-9.]+)\s+([0-9.]+)\s*\)$/i.exec(v);
  if (!m) return null;
  const L = Number(m[1]) / (m[2] ? 100 : 1);
  const C = Number(m[3]);
  const h = (Number(m[4]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin: RGB = [4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s];
  return lin.map((x) => encode(clamp(x))) as RGB;
}

/** `top` at `alpha` over `under`, composited in sRGB as browsers do. */
export const over = (top: RGB, alpha: number, under: RGB): RGB => top.map((c, i) => c * alpha + (under[i] ?? 0) * (1 - alpha)) as RGB;

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b);
}

export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
