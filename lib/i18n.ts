import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { dictionaries } from "@/lib/i18n-dictionaries";

export const locales = ["ro", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ro";

function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("locale")?.value;

  if (value && isLocale(value)) {
    return value;
  }

  return getConfiguredDefaultLocale();
}

export function resolveLocale(value?: string | null): Locale {
  if (value && isLocale(value)) {
    return value;
  }

  return defaultLocale;
}


const BLOCKED_PATH_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

const getConfiguredDefaultLocale = async (): Promise<Locale> => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: { defaultLocale: true },
    });
    return resolveLocale(settings?.defaultLocale);
  } catch {
    return defaultLocale;
  }
};

function flattenRecord(record: unknown, prefix = "", out: Record<string, string> = {}) {
  if (!record || typeof record !== "object") {
    return out;
  }

  for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[nextKey] = value;
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenRecord(value, nextKey, out);
    }
  }

  return out;
}

function assignIfPathExists(target: Record<string, unknown>, path: string, value: string) {
  const parts = path.split(".");
  if (parts.length === 0 || parts.some((part) => BLOCKED_PATH_SEGMENTS.has(part))) {
    return;
  }

  let current: Record<string, unknown> | undefined = target;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const segment = parts[i];
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return;
    }

    const next = current?.[segment];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      return;
    }
    current = next as Record<string, unknown>;
  }

  const last = parts[parts.length - 1];
  if (current && Object.prototype.hasOwnProperty.call(current, last) && typeof current[last] === "string") {
    current[last] = value;
  }
}

export function getTranslationCatalog() {
  const roFlat = flattenRecord(dictionaries.ro);
  const enFlat = flattenRecord(dictionaries.en);
  const keys = Array.from(new Set([...Object.keys(roFlat), ...Object.keys(enFlat)])).sort((a, b) => a.localeCompare(b));

  return keys.map((key) => ({
    key,
    ro: roFlat[key] || "",
    en: enFlat[key] || "",
  }));
}

export async function getDictionary(locale?: Locale) {
  const resolved = locale || (await getLocale());
  const base = JSON.parse(JSON.stringify(dictionaries[resolved])) as Record<string, unknown>;

  try {
    const overrides = await prisma.localeTranslation.findMany({
      where: { locale: resolved },
      select: { key: true, value: true },
    });

    for (const item of overrides) {
      assignIfPathExists(base, item.key, item.value);
    }
  } catch {
    return base as (typeof dictionaries)[Locale];
  }

  return base as (typeof dictionaries)[Locale];
}

export async function getDefaultLocaleSetting(): Promise<Locale> {
  return getConfiguredDefaultLocale();
}




