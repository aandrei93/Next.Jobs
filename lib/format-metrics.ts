import type { Locale } from "@/lib/i18n";

export function formatCompactMetric(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
