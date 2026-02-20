import type { Locale } from "@/lib/i18n";
import { localizeKeyPoint } from "@/lib/key-points-i18n";

export type ParsedDescription = {
  paragraphs: string[];
  bullets: string[];
};

export function parseJobDescription(raw: string): ParsedDescription {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const bullets: string[] = [];
  const paragraphs: string[] = [];

  for (const line of lines) {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      bullets.push(line.slice(2).trim());
    } else {
      paragraphs.push(line);
    }
  }

  if (lines.length === 0 && raw.trim()) {
    paragraphs.push(raw.trim());
  }

  return { paragraphs, bullets };
}

export function localizeJobKeyPoints(items: string[], locale: Locale) {
  return items.map((item) => localizeKeyPoint(item, locale));
}
