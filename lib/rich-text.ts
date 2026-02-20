import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "h2", "h3", "blockquote", "a"];

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
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (_tagName: string, attribs: Record<string, string>) => {
        const href = sanitizeHref(attribs.href ?? "");
        if (!href) {
          return { tagName: "span", attribs: {} as Record<string, string> };
        }
        return {
          tagName: "a",
          attribs: {
            href,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        };
      },
    },
    // Remove empty anchors if URL gets rejected.
    exclusiveFilter: (frame: { tag: string; attribs: Record<string, string> }) =>
      frame.tag === "a" && !frame.attribs.href,
  }).trim();
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
