import { describe, expect, it } from "vitest";
import { sanitizeRichText, stripRichText } from "@/lib/rich-text";

describe("sanitizeRichText", () => {
  it("removes script tags and keeps safe content", () => {
    const input = "<p>Hello</p><script>alert('xss')</script><p>World</p>";
    expect(sanitizeRichText(input)).toBe("<p>Hello</p><p>World</p>");
  });

  it("removes style and disallowed tags", () => {
    const input = "<style>body{display:none}</style><iframe src='x'></iframe><p>Safe</p>";
    expect(sanitizeRichText(input)).toBe("<p>Safe</p>");
  });

  it("removes dangerous href protocols", () => {
    const input = `<p><a href="javascript:alert(1)">Click</a></p>`;
    expect(sanitizeRichText(input)).toBe("<p>Click</p>");
  });

  it("removes vbscript links", () => {
    const input = `<p><a href="vbscript:msgbox(1)">Click</a></p>`;
    expect(sanitizeRichText(input)).toBe("<p>Click</p>");
  });

  it("keeps safe links and enforces rel/target", () => {
    const input = `<p><a href="https://example.com/jobs">Jobs</a></p>`;
    expect(sanitizeRichText(input)).toBe('<p><a href="https://example.com/jobs" target="_blank" rel="noopener noreferrer">Jobs</a></p>');
  });
});

describe("stripRichText", () => {
  it("returns plain text from html", () => {
    expect(stripRichText("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("does not double-unescape encoded entities", () => {
    expect(stripRichText("&amp;lt;script&amp;gt;")).toBe("&lt;script&gt;");
  });
});
