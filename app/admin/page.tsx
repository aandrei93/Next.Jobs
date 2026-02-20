import path from "node:path";
import { access } from "node:fs/promises";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArchiveRestore, BriefcaseBusiness, FileText, Rocket, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";

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

function HorizontalBars({
  items,
  formatMetric,
}: {
  items: Array<{ label: string; value: number }>;
  formatMetric: (value: number) => string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
            <span className="truncate pr-2">{item.label}</span>
            <span className="font-semibold text-slate-900">{formatMetric(item.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} />
          </div>
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
    statusCounts,
    publishedJobsInRange,
    applicationsInRange,
    appGroupedByJob,
    suspendedCompanies,
    jobsExpiringSoon,
    staleDrafts,
    recentApplications,
    viewsAggregate,
    errors24h,
    applyRejects24h,
    emailDeliveryFailures24h,
    applications24h,
    errorsPrev24h,
    applicationsPrev24h,
    reviewedJobsInRange,
  ] = await Promise.all([
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
        createdAt: true,
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
    prisma.job.aggregate({ _sum: { viewsCount: true } }),
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
    prisma.job.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: fromDate },
      },
      select: {
        createdAt: true,
        publishedAt: true,
      },
      take: 300,
    }),
  ]);
  const errorSpike = errors24h > Math.max(3, errorsPrev24h * 1.5);
  const applicationDrop = applicationsPrev24h > 0 && applications24h < applicationsPrev24h * 0.5;

  const jobsByStatus = {
    DRAFT: statusCounts.find((item) => item.status === "DRAFT")?._count._all || 0,
    PENDING_REVIEW: statusCounts.find((item) => item.status === "PENDING_REVIEW")?._count._all || 0,
    PUBLISHED: statusCounts.find((item) => item.status === "PUBLISHED")?._count._all || 0,
  };

  const publishedRangeCount = publishedJobsInRange.length;
  const publishRate = publishedRangeCount + jobsByStatus.PENDING_REVIEW > 0 ? ((publishedRangeCount / (publishedRangeCount + jobsByStatus.PENDING_REVIEW)) * 100).toFixed(1) : "0.0";
  const totalViews = viewsAggregate._sum.viewsCount || 0;
  const avgReviewHoursRaw =
    reviewedJobsInRange.length > 0
      ? reviewedJobsInRange.reduce((sum, item) => {
          if (!item.publishedAt) return sum;
          return sum + (item.publishedAt.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
        }, 0) / reviewedJobsInRange.length
      : 0;
  const avgReviewHours = avgReviewHoursRaw > 0 ? avgReviewHoursRaw.toFixed(1) : "0.0";
  const applicationsDeltaPct =
    applicationsPrev24h > 0 ? ((applications24h - applicationsPrev24h) / applicationsPrev24h) * 100 : null;
  const errorsDeltaPct = errorsPrev24h > 0 ? ((errors24h - errorsPrev24h) / errorsPrev24h) * 100 : null;

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

  const jobsStatusTotal = Math.max(1, jobsByStatus.DRAFT + jobsByStatus.PENDING_REVIEW + jobsByStatus.PUBLISHED);
  const draftPct = (jobsByStatus.DRAFT / jobsStatusTotal) * 100;
  const reviewPct = (jobsByStatus.PENDING_REVIEW / jobsStatusTotal) * 100;
  const publishedPct = (jobsByStatus.PUBLISHED / jobsStatusTotal) * 100;

  const executiveKpis = [
    {
      label: isRo ? "Aplicari (24h)" : "Applications (24h)",
      value: formatMetric(applications24h),
      trend:
        applicationsDeltaPct === null
          ? isRo
            ? "fara istoric"
            : "no baseline"
          : `${applicationsDeltaPct >= 0 ? "+" : ""}${applicationsDeltaPct.toFixed(0)}%`,
      trendTone: applicationsDeltaPct !== null && applicationsDeltaPct < 0 ? "text-rose-700" : "text-emerald-700",
      helper: isRo ? "vs 24h anterioare" : "vs previous 24h",
    },
    {
      label: isRo ? "Timp mediu pana la publish" : "Avg time to publish",
      value: `${avgReviewHours}h`,
      trend: isRo ? "review flow" : "review flow",
      trendTone: "text-slate-700",
      helper: isRo ? "calculat pe joburi publicate" : "based on published jobs",
    },
    {
      label: isRo ? "Rata publicare din review" : "Review publish rate",
      value: `${publishRate}%`,
      trend: isRo ? "pending -> published" : "pending -> published",
      trendTone: Number(publishRate) >= 70 ? "text-emerald-700" : "text-amber-700",
      helper: isRo ? "in intervalul selectat" : "in selected range",
    },
    {
      label: isRo ? "Erori runtime (24h)" : "Runtime errors (24h)",
      value: formatMetric(errors24h),
      trend:
        errorsDeltaPct === null ? (isRo ? "fara istoric" : "no baseline") : `${errorsDeltaPct >= 0 ? "+" : ""}${errorsDeltaPct.toFixed(0)}%`,
      trendTone: errorsDeltaPct !== null && errorsDeltaPct > 0 ? "text-rose-700" : "text-emerald-700",
      helper: isRo ? "vs 24h anterioare" : "vs previous 24h",
    },
  ] as const;

  const taskCenter = [
    {
      title: isRo ? "Joburi in asteptare review" : "Jobs waiting review",
      value: jobsByStatus.PENDING_REVIEW,
      href: "/admin/jobs",
      priority: jobsByStatus.PENDING_REVIEW >= 10 ? "high" : jobsByStatus.PENDING_REVIEW > 0 ? "medium" : "low",
      note: isRo ? "Necesita aprobare rapida." : "Needs fast approval.",
      icon: FileText,
    },
    {
      title: isRo ? "Joburi care expira in 7 zile" : "Jobs expiring in 7 days",
      value: jobsExpiringSoon,
      href: "/admin/jobs",
      priority: jobsExpiringSoon >= 10 ? "high" : jobsExpiringSoon > 0 ? "medium" : "low",
      note: isRo ? "Recomandat refresh/repost." : "Recommend refresh/repost.",
      icon: BriefcaseBusiness,
    },
    {
      title: isRo ? "Alerte erori runtime" : "Runtime error alerts",
      value: errors24h,
      href: "/admin/errors",
      priority: errorSpike || errors24h >= 10 ? "high" : errors24h > 0 ? "medium" : "low",
      note: isRo ? "Verifica logurile critice." : "Check critical logs.",
      icon: AlertTriangle,
    },
    {
      title: isRo ? "Companii suspendate" : "Suspended companies",
      value: suspendedCompanies,
      href: "/admin/companies",
      priority: suspendedCompanies > 0 ? "medium" : "low",
      note: isRo ? "Verifica motivele de suspendare." : "Review suspension reasons.",
      icon: BriefcaseBusiness,
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

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/jobs" className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700">
            <FileText className="size-3.5" /> {isRo ? "Create/Moderate Jobs" : "Create/Moderate Jobs"}
          </Link>
          <Link href="/admin/companies" className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">
            <BriefcaseBusiness className="size-3.5" /> {isRo ? "Companii" : "Companies"}
          </Link>
          <Link href="/api/admin/smoke/run" className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">
            <Rocket className="size-3.5" /> {isRo ? "Run smoke" : "Run smoke"}
          </Link>
          <Link href="/admin/settings" className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">
            <ArchiveRestore className="size-3.5" /> {isRo ? "Backup & Settings" : "Backup & Settings"}
          </Link>
          <Link href="/admin/errors" className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">
            <ShieldAlert className="size-3.5" /> {isRo ? "Error Center" : "Error Center"}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {executiveKpis.map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
            <p className={`mt-1 text-xs font-semibold ${item.trendTone}`}>{item.trend}</p>
            <p className="text-xs text-slate-500">{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isRo ? "Task Center - Prioritati" : "Task Center - Priorities"}</h2>
          <p className="text-xs text-slate-500">{isRo ? "Actiuni care necesita atentie acum" : "Actions that need attention now"}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {taskCenter.map((task) => {
            const Icon = task.icon;
            const badgeClass =
              task.priority === "high"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : task.priority === "medium"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200";

            return (
              <Link key={task.title} href={task.href} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                    <Icon className="size-4" /> {task.title}
                  </p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeClass}`}>
                    {task.priority}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatMetric(task.value)}</p>
                <p className="text-xs text-slate-500">{task.note}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{isRo ? "Distributie status joburi" : "Job status distribution"}</h2>
          <div className="mt-4 flex items-center gap-5">
            <div
              className="h-36 w-36 rounded-full border border-slate-200"
              style={{
                background: `conic-gradient(#94a3b8 0 ${draftPct}%, #f59e0b ${draftPct}% ${draftPct + reviewPct}%, #06b6d4 ${draftPct + reviewPct}% 100%)`,
              }}
            />
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-slate-400" />{dict.admin.stageDraft}</span><b>{formatMetric(jobsByStatus.DRAFT)}</b></p>
              <p className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500" />{dict.admin.stageReview}</span><b>{formatMetric(jobsByStatus.PENDING_REVIEW)}</b></p>
              <p className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-cyan-500" />{dict.admin.stagePublished}</span><b>{formatMetric(jobsByStatus.PUBLISHED)}</b></p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">{isRo ? "Pondere publicate" : "Published share"}: {publishedPct.toFixed(1)}%</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{dict.admin.topCompaniesByApplications}</h2>
          <div className="mt-4">
            <HorizontalBars
              items={topCompanies.map((item) => ({ label: item.name, value: item.count }))}
              formatMetric={formatMetric}
            />
            {topCompanies.length === 0 && <p className="text-sm text-slate-500">{dict.admin.noDataRange}</p>}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{dict.admin.analyticsTitle}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{dict.admin.publishedPerDay}</p>
              <TimelineBars timeline={timeline} maxTimelineValue={maxTimelineValue} metric="published" colorClass="bg-cyan-500" />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{dict.admin.applicationsPerDay}</p>
              <TimelineBars timeline={timeline} maxTimelineValue={maxTimelineValue} metric="applications" colorClass="bg-emerald-500" />
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
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

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{dict.admin.topJobsByApplications}</h2>
          <div className="mt-4">
            <HorizontalBars
              items={topJobs.map((item) => ({ label: `${item.title} (${item.companyName})`, value: item.count }))}
              formatMetric={formatMetric}
            />
            {topJobs.length === 0 && <p className="text-sm text-slate-500">{dict.admin.noDataRange}</p>}
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
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs text-slate-500">{isRo ? "Aplicari respinse (24h)" : "Rejected applications (24h)"}</p>
            <p className="font-semibold text-slate-900">{formatMetric(applyRejects24h)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs text-slate-500">{isRo ? "Draft-uri neactualizate" : "Stale drafts"}</p>
            <p className="font-semibold text-slate-900">{formatMetric(staleDrafts)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs text-slate-500">{isRo ? "Vizualizari totale" : "Total views"}</p>
            <p className="font-semibold text-slate-900">{formatCompactMetric(totalViews, locale)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs text-slate-500">{isRo ? "Email delivery failed (24h)" : "Email delivery failed (24h)"}</p>
            <p className="font-semibold text-slate-900">{formatMetric(emailDeliveryFailures24h)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs text-slate-500">{isRo ? "Scadere aplicari 24h" : "24h application drop"}</p>
            <p className={`font-semibold ${applicationDrop ? "text-amber-700" : "text-emerald-700"}`}>{applicationDrop ? (isRo ? "Da" : "Yes") : (isRo ? "Nu" : "No")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

