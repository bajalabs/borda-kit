/**
 * vCard 4.0 (RFC 6350) and phone helpers for the boards. Pure functions over plain
 * values, so the tests can import this file directly (erasable TypeScript, no imports).
 *
 * Only facts present on the board are written: a missing phone, WhatsApp or LinkedIn
 * leaves its property out. EMAIL is required (the card is not offered without one).
 */

export type VCardInput = {
  /** The UID (a URI): urn:uuid:<id> when the board has an id, else the card's URL, so phones merge repeated imports. */
  uid: string;
  fullName: string;
  title?: string | null;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  linkedin?: string | null;
  /** The organisation, e.g. "Example Studio". */
  org: string;
  /** The brand's website, e.g. https://example.com */
  website: string;
  /** Where this vCard is published (SOURCE). */
  source: string;
};

/** RFC 6350 §3.4: escape backslash, comma, semicolon and newlines in a text value. */
export function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r\n|\r|\n/g, "\\n");
}

/** RFC 6350 §3.2: fold lines longer than 75 octets (UTF-8), never inside a character. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  let limit = 75;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > limit) {
      parts.push(current);
      current = "";
      size = 0;
      limit = 74; // continuation lines start with one space
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** N (family;given;…) only when the name splits unambiguously into two words; FN always carries the full name. */
function structuredName(fullName: string): string {
  const [given, family, ...rest] = fullName.trim().split(/\s+/);
  if (given && family && rest.length === 0) return `${escapeText(family)};${escapeText(given)};;;`;
  return `;${escapeText(fullName.trim())};;;`;
}

const digits = (e164: string) => e164.replace(/[^0-9]/g, "");

export function buildVCard(input: VCardInput): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:4.0",
    "KIND:individual",
    `UID:${input.uid}`,
    `FN:${escapeText(input.fullName)}`,
    `N:${structuredName(input.fullName)}`,
    `ORG:${escapeText(input.org)}`,
    ...(input.title ? [`TITLE:${escapeText(input.title)}`] : []),
    `EMAIL;TYPE=work:${input.email}`,
    // text values (allowed by RFC 6350 §6.4.1) import cleanly on iOS, Android and Outlook
    ...(input.phone ? [`TEL;TYPE=work,voice:+${digits(input.phone)}`] : []),
    ...(input.whatsapp && input.whatsapp !== input.phone ? [`TEL;TYPE=text:+${digits(input.whatsapp)}`] : []),
    `URL;TYPE=work:${input.website}`,
    ...(input.linkedin ? [`URL:${input.linkedin}`] : []),
    `SOURCE:${input.source}`,
    "END:VCARD",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

/**
 * E.164 for people to read: +52 AA NNNN NNNN (Mexico, 10 digits) and +1 312 555 0142 (NANP);
 * anything else is shown as stored.
 */
export function formatPhone(e164: string): string {
  const d = digits(e164);
  if (/^52\d{10}$/.test(d)) return `+52 ${d.slice(2, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
  if (/^1\d{10}$/.test(d)) return `+1 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return e164;
}

export const telHref = (e164: string) => `tel:+${digits(e164)}`;
export const whatsappHref = (e164: string) => `https://wa.me/${digits(e164)}`;

/** Two initials for the avatar when there is no photo: first and last word of the name. */
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toLocaleUpperCase();
}
