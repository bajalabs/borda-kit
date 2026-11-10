/**
 * bio_md as HTML, a minimal safe subset: paragraphs (a single newline is a line break), **bold**, *italic* or _italic_,
 * [links](https://…) whose target is http(s), mailto, tel or a site path, and `-` / `*` / `1.` lists. The text is HTML-escaped
 * before anything is read, no raw HTML passes, and a construct outside the subset renders as its own text, so the output needs
 * no sanitiser and the kit needs no dependency. Erasable TypeScript, no imports: the tests import it directly.
 */
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i;

function emphasis(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(?=\S)([\s\S]+?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w*])\*(?=\S)([^*\n]+?\S)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/(^|[^\w_])_(?=\S)([^_\n]+?\S)_(?!\w)/g, "$1<em>$2</em>");
}

/** Inline Markdown of one line: links first, so a marker inside a URL is never read as emphasis. */
export function inline(text: string): string {
  const link = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let out = "";
  let last = 0;
  for (const m of text.matchAll(link)) {
    out += emphasis(text.slice(last, m.index));
    const href = m[2] ?? "";
    out += SAFE_HREF.test(href) ? `<a href="${escapeHtml(href)}"${/^https?:/i.test(href) ? ' rel="noopener"' : ""}>${emphasis(m[1] ?? "")}</a>` : emphasis(m[0]);
    last = m.index + m[0].length;
  }
  return out + emphasis(text.slice(last));
}

export function renderMarkdown(md: string | null | undefined): string {
  if (!md?.trim()) return "";
  return md.replace(/\r\n?/g, "\n").trim().split(/\n{2,}/).map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.every((l) => /^[-*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    if (lines.every((l) => /^\d+[.)]\s+/.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
    return `<p>${lines.map(inline).join("<br>")}</p>`;
  }).join("");
}
