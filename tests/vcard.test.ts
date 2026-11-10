import { expect, test } from "vitest";
import { buildVCard, escapeText, foldLine, formatPhone, initials, telHref, whatsappHref } from "../src/borda/vcard.ts";

const card = {
  uid: "urn:uuid:7b0c3c1e-9a5e-4f2a-9a0e-2b0c6f5d4e3a",
  fullName: "Alex Rivera",
  title: "Creative Director",
  email: "alex@example.com",
  phone: "+13125550142",
  whatsapp: "+13125550142",
  linkedin: "https://example.com/in/alex-rivera",
  org: "Example Studio",
  website: "https://example.com",
  source: "https://boards.example.com/alex-rivera/contact.vcf",
};

test("a vCard 4.0 with UID, FN, N, ORG, TITLE, EMAIL, TEL, URL and SOURCE", () => {
  const v = buildVCard(card);
  expect(v).toMatch(/^BEGIN:VCARD\r\nVERSION:4\.0\r\nKIND:individual\r\n/);
  expect(v).toContain("\r\nUID:urn:uuid:7b0c3c1e-9a5e-4f2a-9a0e-2b0c6f5d4e3a\r\n");
  expect(v).toContain("\r\nFN:Alex Rivera\r\nN:Rivera;Alex;;;\r\n");
  expect(v).toContain("EMAIL;TYPE=work:alex@example.com");
  expect(v).toContain("TEL;TYPE=work,voice:+13125550142");
  expect(v).not.toContain("TEL;TYPE=text"); // WhatsApp on the same number is not repeated
  expect(v).toContain("URL:https://example.com/in/alex-rivera");
  expect(v).toMatch(/SOURCE:https:\/\/boards\.example\.com\/alex-rivera\/contact\.vcf\r\nEND:VCARD\r\n$/);
});

test("missing facts leave their property out", () => {
  const v = buildVCard({ ...card, title: null, phone: null, whatsapp: "+13125550177", linkedin: null });
  expect(v).not.toContain("TITLE:");
  expect(v).not.toContain("TEL;TYPE=work");
  expect(v).toContain("TEL;TYPE=text:+13125550177");
  expect(v.match(/^URL/gm)).toHaveLength(1);
});

test("escape, fold, phones, initials", () => {
  // RFC 6350 §3.4: backslash, comma, semicolon and newlines are escaped
  expect(escapeText("a,b;c\nd\\")).toBe("a\\,b\\;c\\nd\\\\");
  const folded = foldLine(`NOTE:${"é".repeat(60)}`);
  expect(folded).toContain("\r\n ");
  for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  expect(formatPhone("+13125550142")).toBe("+1 312 555 0142");
  expect(formatPhone("+520000000000")).toBe("+52 00 0000 0000"); // Mexico: 10 digits as 2-4-4
  expect(formatPhone("+442079460123")).toBe("+442079460123");
  expect(telHref("+13125550142")).toBe("tel:+13125550142");
  expect(whatsappHref("+13125550142")).toBe("https://wa.me/13125550142");
  expect(initials("Alex Rivera")).toBe("AR");
  expect(initials("Mina de la Castillo")).toBe("MC");
  expect(initials("Sam")).toBe("S");
});
