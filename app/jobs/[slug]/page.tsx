import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Clock3, Eye, Globe2, Hash, MapPin, Wallet } from "lucide-react";
import { CompanyOverviewCard } from "@/components/job-details/company-overview-card";
import { JobApplyForm } from "@/components/job-apply-form";
import { KeyPointsPanel } from "@/components/job-details/key-points-panel";
import { JobViewTracker } from "@/components/job-view-tracker";
import { getApplicationStatusBadgeClass, getApplicationStatusLabels } from "@/lib/application-status";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";
import { localizeJobKeyPoints, parseJobDescription } from "@/lib/job-description";
import { relativeDate } from "@/lib/jobs-query";
import { toggleSavedJob } from "@/lib/public-actions";
import { isRichHtml, sanitizeRichText, stripRichText } from "@/lib/rich-text";
import { formatSalary } from "@/lib/utils";

type JobDetailsProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ toast?: string | string[] }>;
};

export async function generateMetadata({ params }: JobDetailsProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: { title: true, summary: true, location: true, company: { select: { name: true } } },
  });

  if (!job) {
    return {
      title: "Job",
    };
  }
  const summaryText = stripRichText(job.summary);

  return {
    title: `${job.title} - ${job.company.name}`,
    description: summaryText,
    openGraph: {
      title: `${job.title} - ${job.company.name}`,
      description: summaryText,
      type: "article",
      images: [{ url: `/jobs/${slug}/opengraph-image` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} - ${job.company.name}`,
      description: summaryText,
      images: [`/jobs/${slug}/twitter-image`],
    },
  };
}

function firstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }
  return Array.isArray(value) ? value[0] : value;
}

export default async function JobDetailsPage({ params, searchParams }: JobDetailsProps) {
  const { slug } = await params;
  const rawSearchParams = await searchParams;
  const toast = firstValue(rawSearchParams.toast);

  const [job, session, locale] = await Promise.all([
    prisma.job.findUnique({
      where: { slug },
      include: {
        company: true,
        category: true,
      },
    }),
    getCurrentSession(),
    getLocale(),
  ]);
  const hasProfileResume = session?.user.id
    ? Boolean(
        await prisma.resume.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        })
      )
    : false;
  const existingApplication =
    session?.user.id && session.user.accountType === "candidate"
      ? await prisma.application.findFirst({
          where: { jobId: job?.id || "", userId: session.user.id },
          select: { id: true, status: true },
        })
      : false;

  const isExpired = Boolean(job?.expirationDate && job.expirationDate < new Date());
  const canApply = !session || session.user.accountType !== "employer";
  const canApplyNow = canApply && !existingApplication;

  if (!job || job.status !== "PUBLISHED" || isExpired) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const statusLabels = getApplicationStatusLabels(locale);
  const sanitizedSummary = sanitizeRichText(job.summary);
  const sanitizedDescription = sanitizeRichText(job.description);
  const plainSummary = stripRichText(sanitizedSummary);
  const hasHtmlDescription = isRichHtml(sanitizedDescription);
  const { paragraphs, bullets } = parseJobDescription(sanitizedDescription);
  const localizedBullets = localizeJobKeyPoints(bullets, locale);

  const isSaved = session
    ? Boolean(
        await prisma.savedJob.findUnique({
          where: {
            userId_jobId: {
              userId: session.user.id,
              jobId: job.id,
            },
          },
          select: { id: true },
        })
      )
    : false;

  const quickFacts = [
    { icon: MapPin, label: dict.jobs.location, value: job.location },
    { icon: Briefcase, label: dict.jobs.employmentType, value: job.employmentType },
    { icon: Wallet, label: isRo ? "Pachet salarial" : "Compensation", value: formatSalary(job.salaryMin, job.salaryMax, job.currency, locale, dict.common.salaryNotDisclosed) },
    {
      icon: Clock3,
      label: isRo ? "Data expirare" : "Expiration Date",
      value: job.expirationDate ? job.expirationDate.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB") : "-",
    },
    { icon: Hash, label: isRo ? "Numar referinta" : "Reference Number", value: job.referenceNumber || "-" },
    { icon: Eye, label: isRo ? "Vizualizari reale" : "Unique views", value: formatCompactMetric(job.viewsCount, locale) },
    { icon: Globe2, label: isRo ? "Mod lucru" : "Work mode", value: job.isRemote ? dict.common.remote : isRo ? "On-site / hybrid" : "On-site / hybrid" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: stripRichText(sanitizedDescription),
    datePosted: job.createdAt.toISOString(),
    validThrough: job.expirationDate ? job.expirationDate.toISOString() : undefined,
    employmentType: job.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      sameAs: job.company.website || undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
      },
    },
    applicantLocationRequirements: job.isRemote
      ? {
          "@type": "Country",
          name: locale === "ro" ? "Remote" : "Remote",
        }
      : undefined,
    baseSalary:
      job.salaryMin || job.salaryMax
        ? {
            "@type": "MonetaryAmount",
            currency: job.currency,
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salaryMin || undefined,
              maxValue: job.salaryMax || undefined,
              unitText: "MONTH",
            },
          }
        : undefined,
    identifier: job.referenceNumber
      ? {
          "@type": "PropertyValue",
          name: "Reference Number",
          value: job.referenceNumber,
        }
      : undefined,
  };

  return (
    <main className="w-full px-[var(--layout-gutter)] py-8">
      {toast === "applied" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {isRo ? "Aplicarea a fost trimisa cu succes." : "Application submitted successfully."}
        </div>
      ) : null}
      {toast === "apply_error" ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {isRo ? "Nu am putut trimite aplicarea." : "Could not submit the application."}
        </div>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <JobViewTracker jobId={job.id} />
      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.72)] md:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-800">{job.company.name}</span>
          {job.category && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{job.category.name}</span>}
          {job.isRemote && <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">{dict.common.remote}</span>}
        </div>

        <h1 className="mt-4 max-w-4xl font-[var(--font-sora)] text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">{job.title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">{plainSummary || "-"}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <form action={toggleSavedJob}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="returnTo" value={`/jobs/${job.slug}`} />
            <button
              className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-medium ${
                isSaved
                  ? "border-cyan-700 bg-cyan-700 text-white hover:bg-cyan-800"
                  : "border-slate-300 bg-white text-slate-800 hover:border-cyan-700 hover:text-cyan-800"
              }`}
            >
              {isSaved ? dict.common.saved : dict.jobs.saveThisJob}
            </button>
          </form>
          <Link href="/jobs" className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400">
            {isRo ? "Inapoi la lista" : "Back to jobs"}
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <article className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickFacts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <fact.icon className="size-3.5" /> {fact.label}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">{fact.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-7">
            <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900">{isRo ? "Descrierea rolului" : "Role description"}</h2>
            {hasHtmlDescription ? (
              <div className="rt-content mt-4 text-[15px] leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
            ) : (
              <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700">
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => <p key={`${job.id}-paragraph-${index}`}>{paragraph}</p>)
                ) : (
                  <p>{sanitizedDescription}</p>
                )}
              </div>
            )}

            {!hasHtmlDescription && <KeyPointsPanel locale={locale} title={dict.jobs.keyPoints} items={localizedBullets} />}
          </div>
          <CompanyOverviewCard locale={locale} company={job.company} jobLocation={job.location} />
        </article>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_25px_70px_-52px_rgba(15,23,42,0.7)] lg:sticky lg:top-24">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-900">{dict.jobs.applyNow}</h2>
            <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock3 className="size-3.5" /> {relativeDate(job.createdAt, locale)}
            </p>
          </div>
          {canApplyNow ? (
            <JobApplyForm
              jobId={job.id}
              sessionUser={{ name: session?.user.name, email: session?.user.email }}
              hasProfileResume={hasProfileResume}
              locale={locale}
              labels={{
                fullName: dict.jobs.fullName,
                emailPlaceholder: dict.register.emailPlaceholder,
                cvLink: dict.jobs.cvLink,
                message: dict.jobs.message,
                submitApplication: dict.jobs.submitApplication,
              }}
            />
          ) : existingApplication ? (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
              <p>{isRo ? "Ai aplicat deja la acest job." : "You already applied to this job."}</p>
              <p className="mt-2">
                <span className={["inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getApplicationStatusBadgeClass(existingApplication.status)].join(" ")}>
                  {isRo ? "Status: " : "Status: "}
                  {statusLabels[existingApplication.status]}
                </span>
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {isRo ? "Conturile de angajator nu pot aplica la joburi." : "Employer accounts cannot apply to jobs."}
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}
