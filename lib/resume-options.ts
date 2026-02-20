export type WorkPreferenceCode = "REMOTE" | "HYBRID" | "ONSITE";
export type AvailabilityCode = "IMMEDIATELY" | "TWO_WEEKS" | "ONE_MONTH";
export type WorkAuthorizationCode = "WORK_AUTH_RO" | "WORK_AUTH_EU" | "REQUIRES_SPONSORSHIP";

const workPreferenceAliases: Record<string, WorkPreferenceCode> = {
  remote: "REMOTE",
  hibrid: "HYBRID",
  hybrid: "HYBRID",
  "la birou": "ONSITE",
  "on-site": "ONSITE",
  onsite: "ONSITE",
};

const availabilityAliases: Record<string, AvailabilityCode> = {
  imediat: "IMMEDIATELY",
  immediately: "IMMEDIATELY",
  "2 saptamani": "TWO_WEEKS",
  "2 weeks": "TWO_WEEKS",
  "1 luna": "ONE_MONTH",
  "1 month": "ONE_MONTH",
};

const workAuthorizationAliases: Record<string, WorkAuthorizationCode> = {
  "drept de munca in ro": "WORK_AUTH_RO",
  "work authorized in ro": "WORK_AUTH_RO",
  "drept de munca in ue": "WORK_AUTH_EU",
  "work authorized in eu": "WORK_AUTH_EU",
  "necesita sponsorship": "REQUIRES_SPONSORSHIP",
  "requires sponsorship": "REQUIRES_SPONSORSHIP",
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeWorkPreference(value: string | null | undefined) {
  if (!value) return "";
  const key = normalizeKey(value);
  return workPreferenceAliases[key] || (value as WorkPreferenceCode);
}

export function normalizeAvailability(value: string | null | undefined) {
  if (!value) return "";
  const key = normalizeKey(value);
  return availabilityAliases[key] || (value as AvailabilityCode);
}

export function normalizeWorkAuthorization(value: string | null | undefined) {
  if (!value) return "";
  const key = normalizeKey(value);
  return workAuthorizationAliases[key] || (value as WorkAuthorizationCode);
}

export function workPreferenceLabel(value: string | null | undefined, locale: "ro" | "en") {
  const code = normalizeWorkPreference(value);
  const labels: Record<WorkPreferenceCode, string> =
    locale === "ro"
      ? { REMOTE: "Remote", HYBRID: "Hibrid", ONSITE: "La birou" }
      : { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" };
  return (code && labels[code as WorkPreferenceCode]) || value || "-";
}

export function availabilityLabel(value: string | null | undefined, locale: "ro" | "en") {
  const code = normalizeAvailability(value);
  const labels: Record<AvailabilityCode, string> =
    locale === "ro"
      ? { IMMEDIATELY: "Imediat", TWO_WEEKS: "2 saptamani", ONE_MONTH: "1 luna" }
      : { IMMEDIATELY: "Immediately", TWO_WEEKS: "2 weeks", ONE_MONTH: "1 month" };
  return (code && labels[code as AvailabilityCode]) || value || "-";
}

export function workAuthorizationLabel(value: string | null | undefined, locale: "ro" | "en") {
  const code = normalizeWorkAuthorization(value);
  const labels: Record<WorkAuthorizationCode, string> =
    locale === "ro"
      ? {
          WORK_AUTH_RO: "Drept de munca in RO",
          WORK_AUTH_EU: "Drept de munca in UE",
          REQUIRES_SPONSORSHIP: "Necesita sponsorship",
        }
      : {
          WORK_AUTH_RO: "Work authorized in RO",
          WORK_AUTH_EU: "Work authorized in EU",
          REQUIRES_SPONSORSHIP: "Requires sponsorship",
        };
  return (code && labels[code as WorkAuthorizationCode]) || value || "-";
}
