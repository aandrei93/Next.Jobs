import path from "node:path";
import { access } from "node:fs/promises";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getJobStatusBadgeClass, getJobStatusLabels } from "@/lib/jobs-query";

type AdminPageProps = {
  searchParams: Promise<{
    range?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function getRangeDays(value: string) {
  if (value === "7d") return 7;
  if (value === "90d") return 90;
  return 30;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "ro" ? "Dashboard Admin" : "Admin Dashboard" };
}

function makeDayKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

type TimelinePoint = {
  key: string;
  label: string;
  published: number;
  applications: number;
};

function TimelineBars({
  timeline,
  maxTimelineValue,
  metric,
  colorClass,
}: {
  timeline: TimelinePoint[];
  maxTimelineValue: number;
  metric: "published" | "applications";
  colorClass: string;
}) {
  return (
    <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-1" style={{ ["--cols" as string]: timeline.length }}>
      {timeline.map((point) => (
        <div key={`${point.key}-${metric}`} className="flex flex-col items-center gap-1">
          <div className="flex h-20 w-full items-end rounded-md bg-slate-100 px-1">
            <div
              className={`w-full rounded-sm ${colorClass}`}
              style={{ height: `${Math.max(4, (point[metric] / maxTimelineValue) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }: AdminPageProps) {
  const [locale, rawSearchParams, settings] = await Promise.all([
    getLocale(),
    searchParams,
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
      select: { adminDashboardDefaultRange: true, defaultTimezone: true, smtpHost: true, smtpFrom: true },
    }),
  ]);
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const jobStatusLabels = getJobStatusLabels(locale);
  const formatMetric = (value: number) => formatCompactMetric(value, locale);

  const defaultRange =
    settings.adminDashboardDefaultRange === "7d" ||
    settings.adminDashboardDefaultRange === "30d" ||
    settings.adminDashboardDefaultRange === "90d"
      ? settings.adminDashboardDefaultRange
      : "7d";
  const rangeRaw = firstValue(rawSearchParams.range);
  const selectedRange = rangeRaw === "7d" || rangeRaw === "30d" || rangeRaw === "90d" ? rangeRaw : defaultRange;
  const rangeDays = getRangeDays(selectedRange);
  const analyticsTimezone = settings.defaultTimezone || "Europe/Bucharest";
  const hasHousekeepingSecret = Boolean(process.env.HOUSEKEEPING_SECRET);
  const uploadsPath = path.join(process.cwd(), "public", "uploads");
  const uploadsWritable = await access(uploadsPath).then(() => true).catch(() => false);
  const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);

  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  fromDate.setDate(fromDate.getDate() - (rangeDays - 1));
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);
  const prev24h = new Date();
  prev24h.setHours(prev24h.getHours() - 48);

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [
    jobs,
    companies,
    categories,
    applications,
    users,
    statusCounts,
    publishedJobsInRange,
    applicationsInRange,
    appGroupedByJob,
    suspendedCompanies,
    jobsExpiringSoon,
    staleDrafts,
    recentApplications,
    recentJobs,
    viewsAggregate,
    recentAuditLogs,
    errors24h,
    applyRejects24h,
    emailDeliveryFailures24h,
    applications24h,
    errorsPrev24h,
    applicationsPrev24h,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.company.count(),
    prisma.category.count(),
    prisma.application.count(),
    prisma.user.count(),
    prisma.job.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.job.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: fromDate },
      },
      select: {
        publishedAt: true,
      },
    }),
    prisma.application.findMany({
      where: {
        createdAt: { gte: fromDate },
      },
      select: {
        createdAt: true,
        job: {
          select: {
            companyId: true,
          },
        },
      },
    }),
    prisma.application.groupBy({
      by: ["jobId"],
      where: {
        createdAt: { gte: fromDate },
      },
      _count: { _all: true },
      orderBy: {
        _count: { jobId: "desc" },
      },
      take: 7,
    }),
    prisma.company.count({ where: { isSuspended: true } }),
    prisma.job.count({
      where: {
        status: "PUBLISHED",
        expirationDate: { gte: new Date(), lte: sevenDaysFromNow },
      },
    }),
    prisma.job.count({
      where: {
        status: "DRAFT",
        updatedAt: { lt: fromDate },
      },
    }),
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        status: true,
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { name: true } },
          },
        },
      },
    }),
    prisma.job.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        viewsCount: true,
        company: { select: { name: true } },
        createdBy: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.aggregate({ _sum: { viewsCount: true } }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        summary: true,
        createdAt: true,
        admin: { select: { name: true } },
      },
    }),
    prisma.errorLog.count({
      where: {
        createdAt: { gte: last24h },
      },
    }),
    prisma.errorLog.count({
      where: {
        source: "apply",
        createdAt: { gte: last24h },
      },
    }),
    prisma.errorLog.count({
      where: {
        name: "EmailDeliveryFailed",
        createdAt: { gte: last24h },
      },
    }),
    prisma.application.count({
      where: { createdAt: { gte: last24h } },
    }),
    prisma.errorLog.count({
      where: {
        createdAt: { gte: prev24h, lt: last24h },
      },
    }),
    prisma.application.count({
      where: {
        createdAt: { gte: prev24h, lt: last24h },
      },
    }),
  ]);
  const errorSpike = errors24h > Math.max(3, errorsPrev24h * 1.5);
  const applicationDrop = applicationsPrev24h > 0 && applications24h < applicationsPrev24h * 0.5;

  const jobsByStatus = {
    DRAFT: statusCounts.find((item) => item.status === "DRAFT")?._count._all || 0,
    PENDING_REVIEW: statusCounts.find((item) => item.status === "PENDING_REVIEW")?._count._all || 0,
    PUBLISHED: statusCounts.find((item) => item.status === "PUBLISHED")?._count._all || 0,
  };

  const cards = [
    { label: dict.admin.jobs, value: jobs },
    { label: dict.admin.companies, value: companies },
    { label: dict.admin.categories, value: categories },
    { label: dict.admin.applications, value: applications },
    { label: dict.admin.users, value: users },
  ];
  const publishedRangeCount = publishedJobsInRange.length;
  const applicationsRangeCount = applicationsInRange.length;
  const applicationsPerPublished = publishedRangeCount > 0 ? (applicationsRangeCount / publishedRangeCount).toFixed(2) : "0.00";
  const totalViews = viewsAggregate._sum.viewsCount || 0;
  const compactTotalViews = formatCompactMetric(totalViews, locale);

  const dayKeys: string[] = [];
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    dayKeys.push(makeDayKey(day, analyticsTimezone));
  }

  const publishedPerDayMap = new Map<string, number>();
  for (const item of publishedJobsInRange) {
    if (!item.publishedAt) continue;
    const key = makeDayKey(item.publishedAt, analyticsTimezone);
    publishedPerDayMap.set(key, (publishedPerDayMap.get(key) || 0) + 1);
  }

  const applicationsPerDayMap = new Map<string, number>();
  const companyApplicationsMap = new Map<string, number>();
  for (const item of applicationsInRange) {
    const key = makeDayKey(item.createdAt, analyticsTimezone);
    applicationsPerDayMap.set(key, (applicationsPerDayMap.get(key) || 0) + 1);
    companyApplicationsMap.set(item.job.companyId, (companyApplicationsMap.get(item.job.companyId) || 0) + 1);
  }

  const timeline: TimelinePoint[] = dayKeys.map((key) => {
    const day = new Date(`${key}T00:00:00`);
    return {
      key,
      label: day.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB", { day: "2-digit", month: "2-digit" }),
      published: publishedPerDayMap.get(key) || 0,
      applications: applicationsPerDayMap.get(key) || 0,
    };
  });

  const maxTimelineValue = Math.max(
    1,
    ...timeline.map((point) => Math.max(point.published, point.applications))
  );

  const topCompanyIds = Array.from(companyApplicationsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([companyId]) => companyId);

  const companiesMap = new Map(
    (
      await prisma.company.findMany({
        where: { id: { in: topCompanyIds } },
        select: { id: true, name: true },
      })
    ).map((company) => [company.id, company.name])
  );

  const topCompanies = topCompanyIds.map((companyId) => ({
    id: companyId,
    name: companiesMap.get(companyId) || companyId,
    count: companyApplicationsMap.get(companyId) || 0,
  }));

  const topJobIds = appGroupedByJob.map((item) => item.jobId);
  const jobsMap = new Map(
    (
      await prisma.job.findMany({
        where: { id: { in: topJobIds } },
        select: { id: true, title: true, company: { select: { name: true } } },
      })
    ).map((job) => [job.id, job])
  );

  const topJobs = appGroupedByJob
    .map((item) => {
      const job = jobsMap.get(item.jobId);
      if (!job) return null;
      return {
        id: job.id,
        title: job.title,
        companyName: job.company.name,
        count: item._count._all,
      };
    })
    .filter(Boolean) as Array<{ id: string; title: string; companyName: string; count: number }>;

  const rangeOptions = [
    { key: "7d", label: dict.admin.range7 },
    { key: "30d", label: dict.admin.range30 },
    { key: "90d", label: dict.admin.range90 },
  ] as const;

  const actionCards = [
    {
      href: "/admin/jobs",
      title: isRo ? "Moderare joburi" : "Job moderation",
      subtitle: isRo ? "Review, publicare si administrare joburi." : "Review, publish, and manage jobs.",
      count: jobsByStatus.PENDING_REVIEW,
      countLabel: isRo ? "in review" : "in review",
    },
    {
      href: "/admin/applications",
      title: isRo ? "Flux aplicari" : "Applications flow",
      subtitle: isRo ? "Monitorizeaza aplicari noi si statusuri." : "Track new applications and statuses.",
      count: applicationsRangeCount,
      countLabel: isRo ? "in interval" : "in range",
    },
    {
      href: "/admin/companies",
      title: isRo ? "Companii" : "Companies",
      subtitle: isRo ? "Suspenda/reactiveaza companii rapid." : "Suspend/reactivate companies quickly.",
      count: suspendedCompanies,
      countLabel: isRo ? "suspendate" : "suspended",
    },
    {
      href: "/admin/settings",
      title: isRo ? "Setari platforma" : "Platform settings",
      subtitle: isRo ? "Control pentru functionalitati globale." : "Control global platform behavior.",
      count: jobsExpiringSoon,
      countLabel: isRo ? "expira < 7 zile" : "expiring < 7 days",
    },
  ];

  const alerts = [
    {
      label: isRo ? "Joburi in review" : "Jobs in review",
      value: jobsByStatus.PENDING_REVIEW,
      tone: "amber",
    },
    {
      label: isRo ? "Joburi care expira in 7 zile" : "Jobs expiring in 7 days",
      value: jobsExpiringSoon,
      tone: "rose",
    },
    {
      label: isRo ? "Draft-uri neactualizate" : "Stale drafts",
      value: staleDrafts,
      tone: "slate",
    },
    {
      label: isRo ? "Companii suspendate" : "Suspended companies",
      value: suspendedCompanies,
      tone: "violet",
    },
    {
      label: isRo ? "Spike erori 24h" : "24h error spike",
      value: errorSpike ? 1 : 0,
      tone: errorSpike ? "rose" : "slate",
    },
    {
      label: isRo ? "Scadere aplicari 24h" : "24h application drop",
      value: applicationDrop ? 1 : 0,
      tone: applicationDrop ? "amber" : "slate",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">{dict.admin.dashboard}</h1>
          <p className="mt-1 text-sm text-slate-600">{dict.admin.dashboardSubtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white p-1">
          {rangeOptions.map((item) => (
            <Link
              key={item.key}
              href={`/admin?range=${item.key}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                selectedRange === item.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatMetric(card.value)}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-4">
        {actionCards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{card.title}</p>
            <p className="mt-1 text-xs text-slate-600">{card.subtitle}</p>
            <p className="mt-4 text-2xl font-bold text-slate-900">{formatMetric(card.count)}</p>
            <p className="text-xs text-slate-500">{card.countLabel}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{isRo ? "Joburi publicate" : "Published jobs"}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMetric(publishedRangeCount)}</p>
          <p className="text-xs text-slate-500">{isRo ? "in intervalul selectat" : "in selected range"}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{dict.admin.applications}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMetric(applicationsRangeCount)}</p>
          <p className="text-xs text-slate-500">{isRo ? "in intervalul selectat" : "in selected range"}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{isRo ? "Aplicari per job publicat" : "Applications per published job"}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{applicationsPerPublished}</p>
          <p className="text-xs text-slate-500">{isRo ? "eficienta trafic -> conversie" : "traffic to conversion efficiency"}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{isRo ? "Vizualizari totale" : "Total views"}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{compactTotalViews}</p>
          <p className="text-xs text-slate-500">{isRo ? "toate joburile active/inactive" : "across all jobs"}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{isRo ? "Erori runtime (24h)" : "Runtime errors (24h)"}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMetric(errors24h)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{isRo ? "Aplicari respinse (24h)" : "Rejected applications (24h)"}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMetric(applyRejects24h)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{isRo ? "Aplicari noi (24h)" : "New applications (24h)"}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMetric(applications24h)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">{isRo ? "Email delivery failed (24h)" : "Email delivery failed (24h)"}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMetric(emailDeliveryFailures24h)}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.admin.analyticsTitle}</h2>
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[760px] space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{dict.admin.publishedPerDay}</p>
              <TimelineBars timeline={timeline} maxTimelineValue={maxTimelineValue} metric="published" colorClass="bg-cyan-500" />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{dict.admin.applicationsPerDay}</p>
              <TimelineBars timeline={timeline} maxTimelineValue={maxTimelineValue} metric="applications" colorClass="bg-emerald-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{dict.admin.funnelTitle}</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>{dict.admin.stageDraft}</span>
              <span className="font-semibold">{formatMetric(jobsByStatus.DRAFT)}</span>
            </p>
            <p className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>{dict.admin.stageReview}</span>
              <span className="font-semibold">{formatMetric(jobsByStatus.PENDING_REVIEW)}</span>
            </p>
            <p className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>{dict.admin.stagePublished}</span>
              <span className="font-semibold">{formatMetric(jobsByStatus.PUBLISHED)}</span>
            </p>
            <p className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>{dict.admin.stageApplications}</span>
              <span className="font-semibold">{formatMetric(applicationsInRange.length)}</span>
            </p>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{dict.admin.topCompaniesByApplications}</h2>
          <div className="mt-4 space-y-2 text-sm">
            {topCompanies.map((company) => (
              <p key={company.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{company.name}</span>
                <span className="font-semibold">{formatMetric(company.count)}</span>
              </p>
            ))}
            {topCompanies.length === 0 && <p className="text-slate-500">{dict.admin.noDataRange}</p>}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{dict.admin.topJobsByApplications}</h2>
          <div className="mt-4 space-y-2 text-sm">
            {topJobs.map((job) => (
              <p key={job.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="truncate pr-2">
                  {job.title} ({job.companyName})
                </span>
                <span className="font-semibold">{formatMetric(job.count)}</span>
              </p>
            ))}
            {topJobs.length === 0 && <p className="text-slate-500">{dict.admin.noDataRange}</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{isRo ? "Alerte operationale" : "Operational alerts"}</h2>
          <div className="mt-4 space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.label}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  alert.tone === "amber"
                    ? "bg-amber-50 text-amber-900"
                    : alert.tone === "rose"
                      ? "bg-rose-50 text-rose-900"
                      : alert.tone === "violet"
                        ? "bg-violet-50 text-violet-900"
                        : "bg-slate-100 text-slate-800"
                }`}
              >
                <span>{alert.label}</span>
                <span className="font-semibold">{formatMetric(alert.value)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{isRo ? "Aplicari recente" : "Recent applications"}</h2>
          <div className="mt-4 space-y-2">
            {recentApplications.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">{item.fullName}</p>
                <p className="text-xs text-slate-600">
                  {item.job.title} - {item.job.company.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.status} - {item.createdAt.toLocaleDateString(isRo ? "ro-RO" : "en-GB")}
                </p>
              </div>
            ))}
            {recentApplications.length === 0 && <p className="text-sm text-slate-500">{dict.admin.noApplications}</p>}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Health Center" : "Health Center"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Database", ok: dbHealthy, detail: dbHealthy ? "OK" : "FAIL" },
            { label: "SMTP", ok: Boolean(settings.smtpHost && settings.smtpFrom), detail: settings.smtpHost ? settings.smtpHost : "-" },
            { label: "Uploads", ok: uploadsWritable, detail: uploadsPath },
            { label: "Housekeeping secret", ok: hasHousekeepingSecret, detail: hasHousekeepingSecret ? "set" : "missing" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className={`mt-1 font-semibold ${item.ok ? "text-emerald-700" : "text-rose-700"}`}>
                {item.ok ? (isRo ? "Sanatos" : "Healthy") : (isRo ? "Problema" : "Issue")}
              </p>
              <p className="mt-1 text-xs text-slate-600 break-all">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Joburi actualizate recent" : "Recently updated jobs"}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-3 py-2">{isRo ? "Job" : "Job"}</th>
                <th className="px-3 py-2">{dict.admin.companies}</th>
                <th className="px-3 py-2">{isRo ? "Creat de" : "Created by"}</th>
                <th className="px-3 py-2">{isRo ? "Status" : "Status"}</th>
                <th className="px-3 py-2">{isRo ? "Vizualizari" : "Views"}</th>
                <th className="px-3 py-2">{dict.admin.applications}</th>
                <th className="px-3 py-2">{isRo ? "Actualizat" : "Updated"}</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    <Link href={`/admin/jobs/${job.id}`} className="hover:text-slate-700">
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{job.company.name}</td>
                  <td className="px-3 py-3 text-slate-700">{job.createdBy.name}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getJobStatusBadgeClass(job.status)}`}>{jobStatusLabels[job.status]}</span>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-800">{formatCompactMetric(job.viewsCount, locale)}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">{formatMetric(job._count.applications)}</td>
                  <td className="px-3 py-3 text-slate-600">{job.updatedAt.toLocaleDateString(isRo ? "ro-RO" : "en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentJobs.length === 0 && <p className="mt-3 text-sm text-slate-500">{dict.admin.noJobs}</p>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Audit recent admin" : "Recent admin audit"}</h2>
        <div className="mt-4 space-y-2">
          {recentAuditLogs.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-900">
                {log.action} - {log.targetType}:{log.targetId}
              </p>
              <p className="text-xs text-slate-600">
                {log.admin.name} - {log.createdAt.toLocaleString(isRo ? "ro-RO" : "en-GB")}
              </p>
              {log.summary && <p className="mt-1 text-xs text-slate-500">{log.summary}</p>}
            </div>
          ))}
          {recentAuditLogs.length === 0 && <p className="text-sm text-slate-500">{dict.admin.noDataRange}</p>}
        </div>
      </section>
    </div>
  );
}

