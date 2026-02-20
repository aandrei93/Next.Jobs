"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Building2, ChevronLeft, ChevronRight, Clock3, ExternalLink, Eye, Mail, MapPin, Share2, Wallet } from "lucide-react";
import { EmploymentType } from "@prisma/client";
import { getApplicationStatusBadgeClass, getApplicationStatusLabels, type ApplicationPipelineStatus } from "@/lib/application-status";
import { formatCompactMetric } from "@/lib/format-metrics";
import { relativeDate } from "@/lib/jobs-query";
import { toggleSavedJob } from "@/lib/public-actions";
import { isRichHtml } from "@/lib/rich-text";
import { formatSalary } from "@/lib/utils";
import { JobViewTracker } from "@/components/job-view-tracker";
import { JobApplyForm } from "@/components/job-apply-form";

type JobItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  createdAt: string;
  expirationDate: string | null;
  referenceNumber: string | null;
  viewsCount: number;
  company: { name: string };
  category: { name: string } | null;
};

type JobsMasterDetailProps = {
  jobs: JobItem[];
  selectedSlug: string;
  locale: "ro" | "en";
  employmentTypeLabels: Record<EmploymentType, string>;
  texts: {
    noJobs: string;
    remote: string;
    save: string;
    saved: string;
    location: string;
    employmentType: string;
    salaryNotDisclosed: string;
    applyNow: string;
    fullName: string;
    emailPlaceholder: string;
    cvLink: string;
    message: string;
    submitApplication: string;
    openFullPage: string;
    descriptionTitle: string;
    keyPointsTitle: string;
  };
  sessionUser?: {
    name?: string | null;
    email?: string | null;
  };
  hasProfileResume: boolean;
  savedJobIds: string[];
  appliedStatusByJobId: Record<string, ApplicationPipelineStatus>;
  canApply: boolean;
};

const INITIAL_ITEMS = 12;
const INCREMENT = 10;

function parseDescription(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const bullets: string[] = [];
  const paragraphs: string[] = [];

  for (const line of lines) {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      bullets.push(line.slice(2).trim());
    } else {
      paragraphs.push(line);
    }
  }

  if (lines.length === 0 && raw.trim()) {
    paragraphs.push(raw.trim());
  }

  return { paragraphs, bullets };
}

function formatDate(value: string | null, locale: "ro" | "en") {
  if (!value) {
    return "-";
  }

  const code = locale === "ro" ? "ro-RO" : "en-GB";
  return new Date(value).toLocaleDateString(code, { day: "2-digit", month: "long", year: "numeric" });
}

export function JobsMasterDetail({
  jobs,
  selectedSlug,
  locale,
  employmentTypeLabels,
  texts,
  sessionUser,
  hasProfileResume,
  savedJobIds,
  appliedStatusByJobId,
  canApply,
}: JobsMasterDetailProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const [activeSlug, setActiveSlug] = useState(selectedSlug || jobs[0]?.slug || "");
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeJob = useMemo(() => jobs.find((job) => job.slug === activeSlug) || jobs[0] || null, [activeSlug, jobs]);
  const activeIndex = useMemo(() => jobs.findIndex((job) => job.slug === (activeJob?.slug || "")), [activeJob?.slug, jobs]);
  const savedSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);
  const statusLabels = useMemo(() => getApplicationStatusLabels(locale), [locale]);
  const parsedDescription = useMemo(() => (activeJob ? parseDescription(activeJob.description) : { paragraphs: [], bullets: [] }), [activeJob]);
  const hasHtmlDescription = Boolean(activeJob?.description && isRichHtml(activeJob.description));

  const currentReturnTo = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeJob) {
      params.set("job", activeJob.slug);
    }
    return `${pathname}?${params.toString()}`;
  }, [activeJob, pathname, searchParams]);

  useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;

    if (!root || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(jobs.length, count + INCREMENT));
        }
      },
      {
        root,
        threshold: 0.2,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [jobs.length]);

  useEffect(() => {
    if (!shareNotice) {
      return;
    }
    const timer = setTimeout(() => setShareNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [shareNotice]);

  async function shareActiveJob() {
    if (!activeJob) {
      return;
    }

    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/jobs/${activeJob.slug}`
        : `/jobs/${activeJob.slug}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: activeJob.title,
          text: `${activeJob.title} - ${activeJob.company.name}`,
          url: absoluteUrl,
        });
        setShareNotice(locale === "ro" ? "Link distribuit." : "Link shared.");
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absoluteUrl);
        setShareNotice(locale === "ro" ? "Link copiat." : "Link copied.");
        return;
      }
    } catch {
      setShareNotice(locale === "ro" ? "Nu am putut distribui link-ul." : "Could not share the link.");
      return;
    }

    setShareNotice(locale === "ro" ? "Share indisponibil pe acest device." : "Share is unavailable on this device.");
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[390px_1fr]">
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.72)] xl:sticky xl:top-[164px]">
        <div ref={scrollRootRef} className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
          {jobs.slice(0, visibleCount).map((job) => {
            const active = activeJob?.id === job.id;

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => setActiveSlug(job.slug)}
                className={`block w-full rounded-3xl border p-5 text-left transition ${
                  active
                    ? "border-amber-400 bg-amber-50/70 text-slate-900 shadow-[0_16px_30px_-24px_rgba(217,119,6,0.55)]"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <p className="text-xs text-slate-500">{job.company.name}</p>
                <p className="mt-1 font-[var(--font-sora)] text-[19px] font-semibold leading-snug">{job.title}</p>
                <p className="mt-1 text-sm text-slate-600">{job.location}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 className="size-3" /> {relativeDate(new Date(job.createdAt), locale)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {employmentTypeLabels[job.employmentType]} {job.isRemote ? `- ${texts.remote}` : ""}
                </p>
              </button>
            );
          })}

          {jobs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              {texts.noJobs}
            </div>
          )}
          {visibleCount < jobs.length && <div ref={sentinelRef} className="h-8" />}
        </div>

      </aside>

      <section>
        {activeJob ? (
          <>
          <JobViewTracker jobId={activeJob.id} />
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_70px_-50px_rgba(15,23,42,0.75)]">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-5 md:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                  {activeJob.company.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900 md:text-3xl">{activeJob.title}</h2>
                  <p className="mt-1 text-base text-slate-700">{activeJob.company.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{activeJob.location}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a href={`mailto:hr@${activeJob.company.name.toLowerCase().replace(/\s+/g, "")}.com`} className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                  <Mail className="size-4" /> E-mail
                </a>
                <form action={toggleSavedJob}>
                  <input type="hidden" name="jobId" value={activeJob.id} />
                  <input type="hidden" name="returnTo" value={currentReturnTo} />
                  <button
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${
                      savedSet.has(activeJob.id)
                        ? "border-amber-600 bg-amber-600 text-white hover:bg-amber-700"
                        : "border-slate-300 bg-white text-slate-800 hover:border-amber-700 hover:text-amber-800"
                    }`}
                  >
                    {savedSet.has(activeJob.id) ? texts.saved : texts.save}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={shareActiveJob}
                  title={locale === "ro" ? "Distribuie jobul" : "Share job"}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Share2 className="size-4" />
                </button>
              </div>
            </div>
            {shareNotice ? (
              <p className="px-5 pb-1 text-xs font-medium text-slate-600 md:px-7">{shareNotice}</p>
            ) : null}

            <div className="p-5 md:p-7">
              <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-900">Job details</h3>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-slate-600"><Building2 className="size-4" /> {texts.employmentType}</span>
                  <span className="font-semibold text-slate-900">{employmentTypeLabels[activeJob.employmentType]}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-slate-600"><MapPin className="size-4" /> {texts.location}</span>
                  <span className="font-semibold text-slate-900">{activeJob.location}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-slate-600"><Wallet className="size-4" /> Salary</span>
                  <span className="font-semibold text-slate-900">{formatSalary(activeJob.salaryMin, activeJob.salaryMax, activeJob.currency, locale, texts.salaryNotDisclosed)}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-slate-600"><Clock3 className="size-4" /> Expiration Date</span>
                  <span className="font-semibold text-slate-900">{formatDate(activeJob.expirationDate, locale)}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-slate-600"><Building2 className="size-4" /> Reference Number</span>
                  <span className="font-semibold text-slate-900">{activeJob.referenceNumber || "-"}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-slate-600"><Eye className="size-4" /> {locale === "ro" ? "Vizualizari reale" : "Unique views"}</span>
                  <span className="font-semibold text-slate-900">{formatCompactMetric(activeJob.viewsCount, locale)}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-slate-600"><Clock3 className="size-4" /> Posted</span>
                  <span className="font-semibold text-slate-900">{relativeDate(new Date(activeJob.createdAt), locale)}</span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-[var(--font-sora)] text-xl font-semibold text-slate-900">{texts.descriptionTitle}</h3>
                {hasHtmlDescription ? (
                  <div
                    className="rt-content mt-3 text-sm leading-7 text-slate-700"
                    dangerouslySetInnerHTML={{ __html: activeJob.description }}
                  />
                ) : (
                  <>
                    <div className="mt-3 space-y-4 text-sm leading-7 text-slate-700">
                      {parsedDescription.paragraphs.map((paragraph, index) => (
                        <p key={`${activeJob.id}-desc-${index}`}>{paragraph}</p>
                      ))}
                    </div>
                    {parsedDescription.bullets.length > 0 && (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h4 className="font-[var(--font-sora)] text-base font-semibold text-slate-900">{texts.keyPointsTitle}</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {parsedDescription.bullets.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>

              <aside className="mt-6 h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-900">{texts.applyNow}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 className="size-3.5" /> {relativeDate(new Date(activeJob.createdAt), locale)}
                </p>
                {canApply ? (
                  appliedStatusByJobId[activeJob.id] ? (
                    <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
                      <p>{locale === "ro" ? "Ai aplicat deja la acest job." : "You already applied to this job."}</p>
                      <p className="mt-2">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            getApplicationStatusBadgeClass(appliedStatusByJobId[activeJob.id]),
                          ].join(" ")}
                        >
                          {locale === "ro" ? "Status: " : "Status: "}
                          {statusLabels[appliedStatusByJobId[activeJob.id]]}
                        </span>
                      </p>
                    </div>
                  ) : (
                  <div className="mt-3">
                    <JobApplyForm
                      jobId={activeJob.id}
                      sessionUser={sessionUser}
                      hasProfileResume={hasProfileResume}
                      locale={locale}
                      labels={{
                        fullName: texts.fullName,
                        emailPlaceholder: texts.emailPlaceholder,
                        cvLink: texts.cvLink,
                        message: texts.message,
                        submitApplication: texts.submitApplication,
                      }}
                    />
                  </div>
                  )
                ) : (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {locale === "ro"
                      ? "Conturile de angajator nu pot aplica la joburi."
                      : "Employer accounts cannot apply to jobs."}
                  </p>
                )}
                <Link href={`/jobs/${activeJob.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900">
                  <ExternalLink className="size-3.5" />
                  {texts.openFullPage}
                </Link>
              </aside>
            </div>
          </article>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (activeIndex > 0) {
                  setActiveSlug(jobs[activeIndex - 1].slug);
                }
              }}
              disabled={activeIndex <= 0}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeIndex >= 0 && activeIndex < jobs.length - 1) {
                  setActiveSlug(jobs[activeIndex + 1].slug);
                }
              }}
              disabled={activeIndex < 0 || activeIndex >= jobs.length - 1}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{texts.noJobs}</div>
        )}
      </section>
    </section>
  );
}
