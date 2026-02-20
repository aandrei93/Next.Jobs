import { normalizeSearchInput } from "@/lib/search";

const SYNONYMS: Record<string, string[]> = {
  dev: ["developer", "engineer", "programmer"],
  developer: ["dev", "engineer", "software"],
  frontend: ["front-end", "ui", "react"],
  backend: ["back-end", "api", "server"],
  qa: ["tester", "quality"],
  pm: ["product manager", "project manager"],
};

export function buildSearchTerms(rawQuery: string) {
  const base = normalizeSearchInput(rawQuery).toLowerCase();
  if (!base) {
    return [];
  }

  const terms = new Set<string>();
  for (const part of base.split(" ").filter(Boolean)) {
    terms.add(part);
    (SYNONYMS[part] || []).forEach((value) => terms.add(value));
  }
  return Array.from(terms);
}

function includesTerm(text: string, term: string) {
  return normalizeSearchInput(text).toLowerCase().includes(term);
}

export function scoreJobForQuery(
  job: { title: string; summary: string; description: string; location: string; company: { name: string } },
  terms: string[]
) {
  if (terms.length === 0) {
    return 0;
  }

  let score = 0;
  for (const term of terms) {
    if (includesTerm(job.title, term)) score += 8;
    if (includesTerm(job.company.name, term)) score += 6;
    if (includesTerm(job.summary, term)) score += 4;
    if (includesTerm(job.location, term)) score += 3;
    if (includesTerm(job.description, term)) score += 1;
  }
  return score;
}
