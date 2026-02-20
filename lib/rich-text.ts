import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "h2", "h3", "blockquote", "a"];
const ALLOWED_HREF_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

function sanitizeHref(raw: string) {
  const value = raw.trim();
  if (!value) {
    return "";
  }

  // Normalize away control/space chars attackers use to obfuscate schemes.
  const normalized = value.replace(/[\u0000-\u001f\u007f\s]+/g, "");
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(normalized);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (!ALLOWED_HREF_SCHEMES.has(scheme)) {
      return "";
    }
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
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}
