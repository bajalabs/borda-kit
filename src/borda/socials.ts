/** The icon and the label of a social link: by the network named in the board file (any case, a few aliases), else by the URL's host, else the website globe. */
export type SocialIcon = "linkedin" | "instagram" | "facebook" | "x" | "youtube" | "tiktok" | "website";
const BY_NAME: Record<string, SocialIcon> = { linkedin: "linkedin", instagram: "instagram", ig: "instagram", facebook: "facebook", fb: "facebook", x: "x", twitter: "x", youtube: "youtube", tiktok: "tiktok", web: "website", website: "website", site: "website", sitio: "website", sitioweb: "website" };
const BY_HOST: [RegExp, SocialIcon][] = [[/(^|\.)linkedin\.com$/, "linkedin"], [/(^|\.)instagram\.com$/, "instagram"], [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"], [/(^|\.)(x\.com|twitter\.com)$/, "x"], [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"], [/(^|\.)tiktok\.com$/, "tiktok"]];
const NAMES: Record<SocialIcon, string> = { linkedin: "LinkedIn", instagram: "Instagram", facebook: "Facebook", x: "X", youtube: "YouTube", tiktok: "TikTok", website: "" };

export function socialIcon(network: string, url: string): SocialIcon {
  const byName = BY_NAME[network.trim().toLowerCase().replace(/[^a-z]/g, "")];
  if (byName) return byName;
  try { const host = new URL(url).hostname.toLowerCase(); for (const [re, icon] of BY_HOST) if (re.test(host)) return icon; } catch { /* not a URL: the globe */ }
  return "website";
}

/** What the link says: the board file's label, else the network's name, else the host. */
export function socialLabel(network: string, url: string, label?: string | null): string {
  if (label) return label;
  const name = NAMES[socialIcon(network, url)];
  if (name) return name;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return network; }
}
