export const APPLICATION_PIPELINE = ["NEW", "SCREENING", "INTERVIEW", "OFFER", "REVIEWED", "HIRED", "REJECTED"] as const;

export type ApplicationPipelineStatus = (typeof APPLICATION_PIPELINE)[number];

const labelsEn: Record<ApplicationPipelineStatus, string> = {
  NEW: "New",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REVIEWED: "Reviewed",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

const labelsRo: Record<ApplicationPipelineStatus, string> = {
  NEW: "Noua",
  SCREENING: "Screening",
  INTERVIEW: "Interviu",
  OFFER: "Oferta",
  REVIEWED: "Revizuita",
  HIRED: "Angajat",
  REJECTED: "Respinsa",
};

export function getApplicationStatusLabels(locale: "ro" | "en") {
  return locale === "ro" ? labelsRo : labelsEn;
}

export function getApplicationStatusBadgeClass(status: ApplicationPipelineStatus) {
  if (status === "HIRED") return "bg-emerald-100 text-emerald-800";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  if (status === "NEW") return "bg-blue-100 text-blue-800";
  if (status === "SCREENING" || status === "INTERVIEW" || status === "OFFER") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}
