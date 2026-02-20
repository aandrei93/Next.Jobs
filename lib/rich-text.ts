const ALLOWED_TAGS = new Set(["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "h2", "h3", "blockquote", "a"]);

function sanitizeHref(raw: string) {
  const value = raw.trim();
  if (!value) {
    return "";
  }
  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return "";
  }
  return value;
}

export function sanitizeRichText(input: string) {
  const withoutDangerousBlocks = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|option)[\s\S]*?>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|option)[^>]*\/?>/gi, "");

  return withoutDangerousBlocks
    .replace(/<([^>]+)>/g, (_, content: string) => {
      const trimmed = content.trim();
      const closing = trimmed.startsWith("/");
      const tagName = (closing ? trimmed.slice(1) : trimmed).split(/\s+/)[0].toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        return "";
      }

      if (closing) {
        return `</${tagName}>`;
      }

      if (tagName === "br") {
        return "<br>";
      }

      if (tagName === "a") {
        const hrefMatch = trimmed.match(/\shref\s*=\s*(['"])(.*?)\1/i);
        const href = sanitizeHref(hrefMatch?.[2] || "");
        if (!href) {
          return "";
        }
        return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
      }

      return `<${tagName}>`;
    })
    .trim();
}

export function stripRichText(input: string) {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}
