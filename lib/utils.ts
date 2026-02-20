export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = "EUR",
  locale: "ro" | "en" = "en",
  undisclosedLabel = "Salary not disclosed"
) {
  const localeCode = locale === "ro" ? "ro-RO" : "en-GB";

  if (!min && !max) {
    return undisclosedLabel;
  }

  if (min && max) {
    return `${min.toLocaleString(localeCode)} - ${max.toLocaleString(localeCode)} ${currency}`;
  }

  return `${(min || max || 0).toLocaleString(localeCode)} ${currency}`;
}

