import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, MapPin, Wallet } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getEmploymentTypeLabels, relativeDate } from "@/lib/jobs-query";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { toggleSavedJob } from "@/lib/public-actions";
import { formatSalary } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "ro" ? "Joburi salvate" : "Saved jobs",
  };
}

export default async function SavedJobsPage() {
  const [session, locale, settings] = await Promise.all([
    getCurrentSession(),
    getLocale(),
    prisma.siteSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} }),
  ]);

  if (!session) {
    redirect("/login?callbackUrl=/saved-jobs");
  }

  const dict = await getDictionary(locale);
  const employmentTypeLabels = getEmploymentTypeLabels(locale);

  if (!settings.featureSavedJobs) {
    return (
      <main className="w-full px-[var(--layout-gutter)] py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {locale === "ro" ? "Functionalitatea Saved Jobs este dezactivata de administrator." : "Saved Jobs feature is disabled by administrator."}
        </div>
      </main>
    );
  }

  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: session.user.id },
    include: {
      job: {
        include: {
          company: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="w-full px-[var(--layout-gutter)] py-8">
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <h1 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900">{dict.jobs.savedJobs}</h1>
        <p className="mt-1 text-sm text-slate-600">{dict.jobs.manageShortlist}</p>
      </section>

      <div className="space-y-3">
        {savedJobs.map((saved) => (
          <article key={saved.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.65)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-medium text-cyan-800">{saved.job.company.name}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{employmentTypeLabels[saved.job.employmentType]}</span>
                {saved.job.isRemote && <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">{dict.common.remote}</span>}
              </div>
              <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <Clock3 className="size-3.5" /> {dict.jobs.savedAt} {relativeDate(saved.createdAt, locale)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-900">{saved.job.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{saved.job.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-4" /> {saved.job.location}
                  </span>
                  {saved.job.category && <span>{saved.job.category.name}</span>}
                </div>
              </div>

              <div className="text-right">
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
                  <Wallet className="size-4" /> {formatSalary(saved.job.salaryMin, saved.job.salaryMax, saved.job.currency, locale, dict.common.salaryNotDisclosed)}
                </p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <Link
                    href={`/jobs/${saved.job.slug}`}
                    className="inline-flex rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-800 hover:border-cyan-700 hover:text-cyan-800"
                  >
                    {dict.common.viewJob}
                  </Link>
                  <form action={toggleSavedJob}>
                    <input type="hidden" name="jobId" value={saved.job.id} />
                    <input type="hidden" name="returnTo" value="/saved-jobs" />
                    <ConfirmSubmitButton
                      confirmMessage={locale === "ro" ? "Sigur vrei sa elimini jobul din lista salvata?" : "Are you sure you want to remove this job from saved list?"}
                      dialogTitle={locale === "ro" ? "Confirmare eliminare job salvat" : "Confirm saved job removal"}
                      cancelLabel={locale === "ro" ? "Renunta" : "Cancel"}
                      confirmLabel={locale === "ro" ? "Confirma" : "Confirm"}
                      className="inline-flex rounded-full border border-rose-300 px-4 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                    >
                      {dict.jobs.remove}
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </div>
          </article>
        ))}

        {savedJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {dict.jobs.noSaved} <Link href="/jobs" className="font-semibold text-slate-900">{dict.jobs.browseJobs}</Link>.
          </div>
        )}
      </div>
    </main>
  );
}


