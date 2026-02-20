import { EmploymentType, JobStatus, Prisma } from "@prisma/client";
type Locale = "ro" | "en";

export type JobsSearchParams = {
  q?: string | string[];
  location?: string | string[];
  city?: string | string[];
  category?: string | string[];
  posted?: string | string[];
  seniority?: string | string[];
  company?: string | string[];
  remote?: string | string[];
  type?: string | string[];
  employment_type?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

export type JobsSort = "newest" | "oldest" | "salary_desc" | "salary_asc";

export type ParsedJobsFilters = {
  q: string;
  location: string;
  city: string;
  category: string;
  posted: "any" | "24h" | "7d" | "30d";
  seniority: "any" | "entry" | "mid" | "senior" | "lead";
  company: string;
  remote: boolean;
  selectedTypes: EmploymentType[];
  sort: JobsSort;
  page: number;
};

export const typeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const typeLabelsRo: Record<EmploymentType, string> = {
  FULL_TIME: "Norma intreaga",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const jobStatusLabels: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

const jobStatusLabelsRo: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "In review",
  PUBLISHED: "Publicat",
  CLOSED: "Inchis",
};

export const externalCodeToType: Record<string, EmploymentType> = {
  "27": "FULL_TIME",
  "282": "PART_TIME",
  "286": "CONTRACT",
  "287": "INTERNSHIP",
};

export const typeToExternalCode: Record<EmploymentType, string> = {
  FULL_TIME: "27",
  PART_TIME: "282",
  CONTRACT: "286",
  INTERNSHIP: "287",
};

export function getEmploymentTypeLabels(locale: Locale): Record<EmploymentType, string> {
  return locale === "ro" ? typeLabelsRo : typeLabels;
}

export function getJobStatusLabels(locale: Locale): Record<JobStatus, string> {
  return locale === "ro" ? jobStatusLabelsRo : jobStatusLabels;
}

export function getJobStatusBadgeClass(status: JobStatus) {
  if (status === "PUBLISHED") return "bg-emerald-100 text-emerald-800";
  if (status === "PENDING_REVIEW") return "bg-amber-100 text-amber-800";
  if (status === "DRAFT") return "bg-slate-100 text-slate-700";
  return "bg-rose-100 text-rose-700";
}

function toArray(value?: string | string[]) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function firstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function parseTypes(value?: string | string[]) {
  const flattened = toArray(value)
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);

  const selectedTypes = flattened
    .map((item) => {
      if (Object.values(EmploymentType).includes(item as EmploymentType)) {
        return item as EmploymentType;
      }

      return externalCodeToType[item];
    })
    .filter(Boolean) as EmploymentType[];

  return Array.from(new Set(selectedTypes));
}

export function parseJobsFilters(searchParams: JobsSearchParams): ParsedJobsFilters {
  const q = firstValue(searchParams.q).trim();
  const location = firstValue(searchParams.location).trim();
  const city = firstValue(searchParams.city).trim();
  const category = firstValue(searchParams.category).trim();
  const postedRaw = firstValue(searchParams.posted).trim();
  const seniorityRaw = firstValue(searchParams.seniority).trim();
  const company = firstValue(searchParams.company).trim();
  const remote = firstValue(searchParams.remote) === "1";
  const selectedTypes = Array.from(new Set([...parseTypes(searchParams.type), ...parseTypes(searchParams.employment_type)]));

  const sortRaw = firstValue(searchParams.sort);
  const sort: JobsSort = ["newest", "oldest", "salary_desc", "salary_asc"].includes(sortRaw)
    ? (sortRaw as JobsSort)
    : "newest";

  const pageRaw = Number(firstValue(searchParams.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const posted: ParsedJobsFilters["posted"] = ["24h", "7d", "30d"].includes(postedRaw)
    ? (postedRaw as ParsedJobsFilters["posted"])
    : "any";
  const seniority: ParsedJobsFilters["seniority"] = ["entry", "mid", "senior", "lead"].includes(seniorityRaw)
    ? (seniorityRaw as ParsedJobsFilters["seniority"])
    : "any";

  return {
    q,
    location,
    city,
    category,
    posted,
    seniority,
    company,
    remote,
    selectedTypes,
    sort,
    page,
  };
}

export function buildJobsQuery(filters: ParsedJobsFilters, overrides?: Partial<ParsedJobsFilters>) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.location) params.set("location", next.location);
  if (next.city) params.set("city", next.city);
  if (next.category) params.set("category", next.category);
  if (next.posted !== "any") params.set("posted", next.posted);
  if (next.seniority !== "any") params.set("seniority", next.seniority);
  if (next.company) params.set("company", next.company);
  if (next.remote) params.set("remote", "1");
  if (next.selectedTypes.length) {
    params.set("employment_type", next.selectedTypes.map((item) => typeToExternalCode[item]).join(","));
  }
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  return params.toString();
}

export function getJobsOrderBy(sort: JobsSort): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "salary_desc":
      return [{ salaryMax: "desc" }, { createdAt: "desc" }];
    case "salary_asc":
      return [{ salaryMin: "asc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export function relativeDate(value: Date, locale: Locale) {
  const now = Date.now();
  const days = Math.max(1, Math.floor((now - value.getTime()) / (1000 * 60 * 60 * 24)));
  const localeCode = locale === "ro" ? "ro-RO" : "en-GB";

  if (days === 1) {
    return locale === "ro" ? "acum 1 zi" : "1 day ago";
  }

  if (days < 7) {
    return locale === "ro" ? `acum ${days} zile` : `${days} days ago`;
  }

  return value.toLocaleDateString(localeCode);
}


