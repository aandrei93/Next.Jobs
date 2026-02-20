import type { Locale } from "@/lib/i18n";

type KeyPointPair = {
  en: string;
  ro: string;
};

const KEY_POINT_PAIRS: KeyPointPair[] = [
  {
    en: "Build and iterate features with strong attention to quality",
    ro: "Construieste si imbunatateste functionalitati cu atentie ridicata la calitate",
  },
  {
    en: "Partner with product and design for roadmap delivery",
    ro: "Colaboreaza cu product si design pentru livrarea roadmap-ului",
  },
  {
    en: "Improve performance, reliability and user experience",
    ro: "Imbunatateste performanta, fiabilitatea si experienta utilizatorului",
  },
  {
    en: "Share knowledge with the team and document decisions",
    ro: "Implica-te in transferul de cunostinte si documenteaza deciziile tehnice",
  },
];

function normalizeKeyPoint(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .toLowerCase();
}

const EN_TO_RO = new Map(KEY_POINT_PAIRS.map((item) => [normalizeKeyPoint(item.en), item.ro]));
const RO_TO_EN = new Map(KEY_POINT_PAIRS.map((item) => [normalizeKeyPoint(item.ro), item.en]));

export function localizeKeyPoint(value: string, locale: Locale) {
  const key = normalizeKeyPoint(value);

  if (locale === "ro") {
    return EN_TO_RO.get(key) || value;
  }

  return RO_TO_EN.get(key) || value;
}
