import type { Metadata } from "next";
import { EmploymentType, Prisma } from "@prisma/client";
import { JobsFiltersBar } from "@/components/jobs-filters-bar";
import { JobsMasterDetail } from "@/components/jobs-master-detail";
import { type ApplicationPipelineStatus } from "@/lib/application-status";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getEmploymentTypeLabels, getJobsOrderBy, parseJobsFilters, type JobsSearchParams } from "@/lib/jobs-query";
import { buildSearchTerms, scoreJobForQuery } from "@/lib/local-search";
import { sanitizeRichText } from "@/lib/rich-text";
import { normalizeSearchInput } from "@/lib/search";

type JobsPageProps = {
  searchParams: Promise<JobsSearchParams & { job?: string | string[]; toast?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: JobsPageProps): Promise<Metadata> {
  const [rawSearchParams, locale] = await Promise.all([searchParams, getLocale()]);
  const selectedSlug = firstValue(rawSearchParams.job);

  if (selectedSlug) {
    const selectedJob = await prisma.job.findUnique({
      where: { slug: selectedSlug },
      select: { title: true, company: { select: { name: true } } },
    });

    if (selectedJob) {
      return {
        title: `${selectedJob.title} - ${selectedJob.company.name}`,
      };
    }
  }

  const parsedFilters = parseJobsFilters(rawSearchParams);
  if (parsedFilters.q) {
    return {
      title: locale === "ro" ? `Cautare: ${parsedFilters.q}` : `Search: ${parsedFilters.q}`,
    };
  }

  if (parsedFilters.location) {
    return {
      title: locale === "ro" ? `Joburi in ${parsedFilters.location}` : `Jobs in ${parsedFilters.location}`,
    };
  }

  return {
    title: locale === "ro" ? "Joburi" : "Jobs",
  };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const [rawSearchParams, session, locale] = await Promise.all([searchParams, getCurrentSession(), getLocale()]);
  const dict = await getDictionary(locale);
  const employmentTypeLabels = getEmploymentTypeLabels(locale);
  const parsedFilters = parseJobsFilters(rawSearchParams);
  const normalizedQ = normalizeSearchInput(parsedFilters.q);
  const normalizedLocation = normalizeSearchInput(parsedFilters.location);
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
  const selectedPostedFromUrl = firstValue(rawSearchParams.posted).trim();
  const defaultPostedSetting =
    settings.jobsDefaultPostedFilter === "24h" ||
    settings.jobsDefaultPostedFilter === "7d" ||
    settings.jobsDefaultPostedFilter === "30d" ||
    settings.jobsDefaultPostedFilter === "any"
      ? settings.jobsDefaultPostedFilter
      : "any";
  const effectivePosted = selectedPostedFromUrl ? parsedFilters.posted : defaultPostedSetting;

  const andFilters: Prisma.JobWhereInput[] = [
    {
      status: "PUBLISHED",
      OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
    },
  ];

  if (normalizedQ) {
    andFilters.push({
      OR: [
        { title: { contains: normalizedQ } },
        { summary: { contains: normalizedQ } },
        { company: { name: { contains: normalizedQ } } },
      ],
    });
  }

  if (normalizedLocation) {
    andFilters.push({ location: { contains: normalizedLocation } });
  }

  if (parsedFilters.city) {
    andFilters.push({ location: parsedFilters.city });
  }

  if (parsedFilters.remote) {
    andFilters.push({ isRemote: true });
  }

  if (parsedFilters.selectedTypes.length) {
    andFilters.push({ employmentType: { in: parsedFilters.selectedTypes } });
  }

  if (parsedFilters.category) {
    andFilters.push({ category: { slug: parsedFilters.category } });
  }

  if (effectivePosted !== "any") {
    const days = effectivePosted === "24h" ? 1 : effectivePosted === "7d" ? 7 : 30;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - days);
    andFilters.push({ createdAt: { gte: minDate } });
  }

  if (parsedFilters.seniority !== "any") {
    const seniorityTokens: Record<Exclude<typeof parsedFilters.seniority, "any">, string[]> = {
      entry: ["junior", "entry", "intern", "trainee"],
      mid: ["mid", "intermediate"],
      senior: ["senior", "sr"],
      lead: ["lead", "principal", "head"],
    };

    const tokens = seniorityTokens[parsedFilters.seniority];
    andFilters.push({
      OR: tokens.flatMap((token) => [
        { title: { contains: token } },
        { summary: { contains: token } },
        { description: { contains: token } },
      ]),
    });
  }

  const where: Prisma.JobWhereInput = { AND: andFilters };

  const [allPublishedJobs, rawJobs, totalMatchingJobs, hasProfileResume] = await Promise.all([
    prisma.job.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      },
      select: { employmentType: true, location: true, category: { select: { slug: true, name: true } } },
    }),
    prisma.job.findMany({
      where,
      include: { company: true, category: true },
      orderBy: getJobsOrderBy(parsedFilters.sort),
      take: Math.max(settings.jobsPerPage * 3, 90),
    }),
    prisma.job.count({ where }),
    session?.user.id
      ? prisma.resume
          .findUnique({
            where: { userId: session.user.id },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
  ]);

  const queryTerms = buildSearchTerms(normalizedQ);
  const jobs =
    queryTerms.length > 0
      ? rawJobs
          .map((job) => ({ job, score: scoreJobForQuery(job, queryTerms) }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score || b.job.createdAt.getTime() - a.job.createdAt.getTime())
          .map((item) => item.job)
          .slice(0, Math.max(settings.jobsPerPage, 30))
      : rawJobs.slice(0, Math.max(settings.jobsPerPage, 30));

  const totalJobs = jobs.length;

  const selectedSlug = firstValue(rawSearchParams.job);

  const savedIds =
    session
      ? new Set(
          (
            await prisma.savedJob.findMany({
              where: {
                userId: session.user.id,
                jobId: { in: jobs.map((job) => job.id) },
              },
              select: { jobId: true },
            })
          ).map((item) => item.jobId)
        )
      : new Set<string>();
  const appliedApplications =
    session?.user.id && session.user.accountType === "candidate"
      ? await prisma.application.findMany({
          where: { userId: session.user.id, jobId: { in: jobs.map((job) => job.id) } },
          select: { jobId: true, status: true },
        })
      : [];
  const appliedStatusByJobId = Object.fromEntries(
    appliedApplications.map((item) => [item.jobId, item.status as ApplicationPipelineStatus])
  ) as Record<string, ApplicationPipelineStatus>;

  const typeCounts = allPublishedJobs.reduce<Record<EmploymentType, number>>(
    (acc, item) => {
      acc[item.employmentType] += 1;
      return acc;
    },
    {
      FULL_TIME: 0,
      PART_TIME: 0,
      CONTRACT: 0,
      INTERNSHIP: 0,
    }
  );
  const cityCounts = allPublishedJobs.reduce<Record<string, number>>((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {});

  const cityOptions = Object.entries(cityCounts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  const categoryMap = allPublishedJobs.reduce<Record<string, { label: string; count: number }>>((acc, item) => {
    const slug = item.category?.slug;
    const name = item.category?.name;
    if (!slug || !name) {
      return acc;
    }

    if (!acc[slug]) {
      acc[slug] = { label: name, count: 0 };
    }
    acc[slug].count += 1;
    return acc;
  }, {});

  const categoryOptions = Object.entries(categoryMap)
    .map(([value, info]) => ({ value, label: info.label, count: info.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const detailKey = `${parsedFilters.q}|${parsedFilters.location}|${parsedFilters.city}|${parsedFilters.category}|${effectivePosted}|${parsedFilters.seniority}|${parsedFilters.remote ? "1" : "0"}|${parsedFilters.sort}|${parsedFilters.selectedTypes.join(",")}`;
  const canApply = !session || session.user.accountType !== "employer";

  return (
    <main className="w-full px-[var(--layout-gutter)] py-8">
      {firstValue(rawSearchParams.toast) === "applied" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {locale === "ro" ? "Aplicarea a fost trimisa cu succes." : "Application submitted successfully."}
        </div>
      ) : null}
      {firstValue(rawSearchParams.toast) === "apply_error" ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {locale === "ro" ? "Nu am putut trimite aplicarea." : "Could not submit the application."}
        </div>
      ) : null}
      <JobsFiltersBar
        initial={{ ...parsedFilters, posted: effectivePosted, company: "", page: 1 }}
        locale={locale}
        typeCounts={typeCounts}
        cityOptions={cityOptions}
        categoryOptions={categoryOptions}
        labels={{
          localeReset: dict.common.reset,
          keywords: dict.jobs.keywords,
          location: dict.jobs.location,
          sort: dict.jobs.sort,
          searchPlaceholder: dict.jobs.searchPlaceholder,
          locationPlaceholder: dict.jobs.locationPlaceholder,
          quickFilters: dict.jobs.quickFilters,
          fullTime: dict.jobs.fullTime,
          contract: dict.jobs.contract,
          remoteOnly: dict.jobs.remoteOnly,
          clearAll: dict.jobs.clearAll,
          filterButton: dict.jobs.filterButton,
          done: dict.jobs.done,
          liveUpdate: dict.jobs.liveFiltering,
          allFilters: dict.jobs.filters,
          employmentType: dict.jobs.employmentType,
          allCities: locale === "ro" ? "Toate orasele" : "All cities",
          allCategories: locale === "ro" ? "Toate categoriile" : "All job categories",
          posted: locale === "ro" ? "Publicat" : "Posted",
          seniority: locale === "ro" ? "Nivel senioritate" : "Seniority level",
          postedAny: locale === "ro" ? "Oricand" : "Any time",
          posted24h: locale === "ro" ? "Ultimele 24h" : "Last 24h",
          posted7d: locale === "ro" ? "Ultimele 7 zile" : "Last 7 days",
          posted30d: locale === "ro" ? "Ultimele 30 zile" : "Last 30 days",
          seniorityAny: locale === "ro" ? "Toate nivelurile" : "All levels",
          seniorityEntry: locale === "ro" ? "Entry / Junior" : "Entry / Junior",
          seniorityMid: locale === "ro" ? "Mid-level" : "Mid-level",
          senioritySenior: locale === "ro" ? "Senior" : "Senior",
          seniorityLead: locale === "ro" ? "Lead / Principal" : "Lead / Principal",
          workMode: dict.jobs.workMode,
          sortNewest: locale === "ro" ? "Cele mai noi" : "Newest first",
          sortOldest: locale === "ro" ? "Cele mai vechi" : "Oldest first",
          sortSalaryDesc: locale === "ro" ? "Salariu desc" : "Highest salary",
          sortSalaryAsc: locale === "ro" ? "Salariu asc" : "Lowest salary",
          employmentTypeLabels,
        }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">
            {dict.jobs.showingRange} <span className="font-semibold text-slate-900">{formatCompactMetric(totalJobs, locale)}</span>{" "}
            {dict.jobs.of} <span className="font-semibold text-slate-900">{formatCompactMetric(totalMatchingJobs, locale)}</span> {dict.jobs.jobs}
          </p>
          <p className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-amber-700">{dict.jobs.liveFiltering}</p>
        </div>

        <JobsMasterDetail
          key={detailKey}
          jobs={jobs.map((job) => ({
            id: job.id,
            slug: job.slug,
            title: job.title,
            summary: sanitizeRichText(job.summary),
            description: sanitizeRichText(job.description),
            location: job.location,
            employmentType: job.employmentType,
            isRemote: job.isRemote,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: job.currency,
            createdAt: job.createdAt.toISOString(),
            expirationDate: job.expirationDate ? job.expirationDate.toISOString() : null,
            referenceNumber: job.referenceNumber,
            viewsCount: job.viewsCount,
            company: { name: job.company.name },
            category: job.category ? { name: job.category.name } : null,
          }))}
          selectedSlug={selectedSlug}
          locale={locale}
          employmentTypeLabels={employmentTypeLabels}
          savedJobIds={Array.from(savedIds)}
          appliedStatusByJobId={appliedStatusByJobId}
          sessionUser={{
            name: session?.user.name,
            email: session?.user.email,
          }}
          hasProfileResume={hasProfileResume}
          canApply={canApply}
          texts={{
            noJobs: dict.common.noJobs,
            remote: dict.common.remote,
            save: dict.common.save,
            saved: dict.common.saved,
            location: dict.jobs.location,
            employmentType: dict.jobs.employmentType,
            salaryNotDisclosed: dict.common.salaryNotDisclosed,
            applyNow: dict.jobs.applyNow,
            fullName: dict.jobs.fullName,
            emailPlaceholder: dict.register.emailPlaceholder,
            cvLink: dict.jobs.cvLink,
            message: dict.jobs.message,
            submitApplication: dict.jobs.submitApplication,
            openFullPage: locale === "ro" ? "Deschide pagina completa" : "Open full page",
            descriptionTitle: locale === "ro" ? "Descriere" : "Description",
            keyPointsTitle: dict.jobs.keyPoints,
          }}
        />
      </JobsFiltersBar>
    </main>
  );
}
