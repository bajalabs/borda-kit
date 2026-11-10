import { expect, test } from "vitest";
import { inline, renderMarkdown } from "../src/borda/markdown.ts";

test("paragraphs, line breaks, bold and italic", () => {
  expect(renderMarkdown("Hello **world**.\nSecond line.\n\nAnother *paragraph* with _emphasis_.")).toBe(
    "<p>Hello <strong>world</strong>.<br>Second line.</p><p>Another <em>paragraph</em> with <em>emphasis</em>.</p>",
  );
  expect(inline("snake_case_name and 2*3*4")).toBe("snake_case_name and 2*3*4");
  expect(renderMarkdown(null)).toBe("");
  expect(renderMarkdown("  \n ")).toBe("");
});

test("links keep http(s), mailto, tel and site paths; anything else is text", () => {
  expect(inline("See [the site](https://example.com/?a=1&b=2)")).toBe('See <a href="https://example.com/?a=1&amp;b=2" rel="noopener">the site</a>');
  expect(inline("[email](mailto:hello@example.com)")).toBe('<a href="mailto:hello@example.com">email</a>');
  expect(inline("[notice](/privacy)")).toBe('<a href="/privacy">notice</a>');
  expect(inline("[x](javascript:alert(1))")).toBe("[x](javascript:alert(1))");
  expect(inline("[x](//evil.example)")).toBe("[x](//evil.example)");
  expect(inline("[**strong**](https://a.b)")).toBe('<a href="https://a.b" rel="noopener"><strong>strong</strong></a>');
});

test("raw HTML never passes", () => {
  expect(renderMarkdown('<script>alert("x")</script> & <b>no</b>')).toBe("<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &lt;b&gt;no&lt;/b&gt;</p>");
  expect(inline('[t](https://a.b/"x)')).toBe('<a href="https://a.b/&quot;x" rel="noopener">t</a>');
  expect(inline('[t](https://a.b/" onclick="x)')).not.toMatch(/<a /);
});

test("bullet and numbered lists", () => {
  expect(renderMarkdown("What we do:\n\n- One\n- *Two*\n* Three\n\n1. First\n2) Second")).toBe(
    "<p>What we do:</p><ul><li>One</li><li><em>Two</em></li><li>Three</li></ul><ol><li>First</li><li>Second</li></ol>",
  );
});
