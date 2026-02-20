import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmploymentType } from "@prisma/client";
import { RichTextEditorField } from "@/components/rich-text-editor-field";
import { createCategorySuggestion, createMyJob, submitMyJobForReview } from "@/lib/user-actions";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getEmploymentTypeLabels, getJobStatusBadgeClass } from "@/lib/jobs-query";
export const metadata: Metadata = { title: "My jobs" };


export default async function WorkspaceJobsPage() {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);
  const dict = await getDictionary(locale);
  const employmentTypeLabels = getEmploymentTypeLabels(locale);
  const isRo = locale === "ro";
  const statusLabels = {
    DRAFT: dict.me.draft,
    PENDING_REVIEW: dict.me.pendingReview,
    PUBLISHED: dict.me.published,
    CLOSED: dict.me.closed,
  } as const;

  if (!session) {
    return null;
  }
  if (session.user.accountType !== "employer") {
    redirect("/me/access-denied?required=employer");
  }

  const [jobs, companiesOwned, categories, settings, allLocations, categorySuggestions] = await Promise.all([
    prisma.job.findMany({
      where: { createdById: session.user.id },
      include: {
        company: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({ where: { ownerId: session.user.id }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    prisma.company.findMany({
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
    }),
    prisma.categorySuggestion.findMany({
      where: { suggestedById: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const locationSuggestions = allLocations.map((item) => item.location);
  const activeCompanies = companiesOwned.filter(
    (company) => !company.isSuspended && company.verificationStatus === "VERIFIED"
  );
  const hasSuspendedCompany = companiesOwned.some((company) => company.isSuspended);
  const hasOnlyUnverifiedCompanies = companiesOwned.length > 0 && activeCompanies.length === 0 && !hasSuspendedCompany;
  const requiresCompany = settings.requireCompanyBeforePosting;
  const canPostJobs = !requiresCompany || activeCompanies.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{dict.me.myJobs}</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{dict.me.postJob}</h2>
            <p className="text-sm text-slate-600">
              {isRo
                ? "Creeaza anuntul in format complet: descriere, companie, salariu si publicare."
                : "Create a complete listing: description, company, salary and publishing data."}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
            {isRo ? "Draft implicit" : "Draft by default"}
          </div>
        </div>

        {!canPostJobs && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              hasSuspendedCompany
                ? "border border-rose-200 bg-rose-50 text-rose-900"
                : "border border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {hasSuspendedCompany
              ? isRo
                ? "Compania ta este suspendata. Nu poti adauga joburi noi sau alte companii pana la reactivare. Contacteaza echipa de suport."
                : "Your company is suspended. You cannot add new jobs or other companies until reactivation. Contact the support team."
              : hasOnlyUnverifiedCompanies
                ? isRo
                  ? "Ai companii, dar nu sunt verificate. Publicarea joburilor este disponibila dupa verificarea unei companii de catre admin."
                  : "You have companies, but none is verified yet. Job posting is enabled after an admin verifies a company."
              : isRo
                ? "Publicarea joburilor este blocata pana cand adaugi o companie proprie activa si verificata."
                : "Job posting is locked until you add an active and verified company."}
            {settings.supportEmail ? (
              <>
                {" "}
                <a href={`mailto:${settings.supportEmail}`} className="underline underline-offset-2">
                  {settings.supportEmail}
                </a>
              </>
            ) : null}
            <Link href="/me/employer/companies" className="ml-1 underline underline-offset-2">
              {isRo ? "Gestioneaza companii" : "Manage companies"}
            </Link>
          </div>
        )}

        <form action={createMyJob} className="mt-5 space-y-4">
          <fieldset disabled={!canPostJobs} className="space-y-4 disabled:opacity-60">
          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{isRo ? "Detalii rol" : "Role details"}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{isRo ? "Titlu job" : "Job title"}</span>
                <input name="title" required placeholder={isRo ? "Ex: Product Designer" : "e.g. Product Designer"} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{dict.jobs.location}</span>
                <input list="my-job-locations" name="location" required placeholder={isRo ? "Ex: Cluj-Napoca / Hybrid" : "e.g. Cluj-Napoca / Hybrid"} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
              </label>
              <RichTextEditorField
                className="md:col-span-2"
                name="summary"
                required
                rows={3}
                label={isRo ? "Sumar" : "Summary"}
                description={isRo ? "Folosit in cardul jobului. Recomandat 2-4 propozitii." : "Used in job card. Recommended 2-4 sentences."}
                placeholder={isRo ? "Descriere scurta pentru lista joburi." : "Short summary used in jobs list."}
              />
              <RichTextEditorField
                className="md:col-span-2"
                name="description"
                required
                rows={8}
                label={isRo ? "Descriere completa" : "Full description"}
                description={isRo ? "Include responsabilitati, cerinte, beneficii si pasii de aplicare." : "Include responsibilities, requirements, benefits, and application steps."}
                placeholder={isRo ? "Scrie responsabilitati, cerinte si beneficii." : "Write responsibilities, requirements and benefits."}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{isRo ? "Companie si parametri" : "Company and parameters"}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{dict.admin.companies}</span>
                <select name="companyId" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="">{dict.admin.companies}</option>
                  {activeCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{dict.admin.categories}</span>
                <select name="categoryId" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="">{dict.admin.categories} (optional)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {dict.me.suggestCategoryTitle}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {dict.me.suggestCategoryDescription}
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    name="name"
                    minLength={2}
                    maxLength={80}
                    placeholder={dict.me.suggestCategoryPlaceholder}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    formAction={createCategorySuggestion}
                    formNoValidate
                    className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
                  >
                    {dict.me.suggestCategorySubmit}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {categorySuggestions.map((suggestion) => (
                    <p key={suggestion.id} className="text-xs text-slate-600">
                      {suggestion.name}{" "}
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-semibold ${
                          suggestion.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : suggestion.status === "REJECTED"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {suggestion.status}
                      </span>
                    </p>
                  ))}
                  {categorySuggestions.length === 0 ? (
                    <p className="text-xs text-slate-500">{dict.me.suggestCategoryNoRecent}</p>
                  ) : null}
                </div>
              </div>

              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{dict.jobs.employmentType}</span>
                <select name="employmentType" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                  {Object.values(EmploymentType).map((item) => (
                    <option key={item} value={item}>
                      {employmentTypeLabels[item]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <input type="checkbox" name="isRemote" /> {dict.common.remote}
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{isRo ? "Compensare si metadata" : "Compensation and metadata"}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{isRo ? "Salariu minim" : "Minimum salary"}</span>
                <input type="number" min={0} name="salaryMin" placeholder="2000" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{isRo ? "Salariu maxim" : "Maximum salary"}</span>
                <input type="number" min={0} name="salaryMax" placeholder="3500" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{isRo ? "Moneda" : "Currency"}</span>
                <select name="currency" defaultValue={settings.defaultCurrency} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="EUR">{isRo ? "Euro (EUR)" : "Euro (EUR)"}</option>
                  <option value="USD">{isRo ? "Dolar american (USD)" : "US Dollar (USD)"}</option>
                  <option value="RON">{isRo ? "Leu romanesc (RON)" : "Romanian Leu (RON)"}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{isRo ? "Data expirare" : "Expiration date"}</span>
                <input type="date" name="expirationDate" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
              </label>
              <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
                {isRo
                  ? `Numarul de referinta se genereaza automat la creare. Expirare implicita: ${settings.defaultJobExpirationDays} zile.`
                  : `Reference number is generated automatically on create. Default expiration: ${settings.defaultJobExpirationDays} days.`}
              </p>
            </div>
          </section>

          <button className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
            {dict.me.postJob}
          </button>
          </fieldset>
          <datalist id="my-job-locations">
            {locationSuggestions.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.me.myPostedJobs}</h2>
        <div className="mt-4 space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-500">
                    {job.company.name} - {job.location} - {employmentTypeLabels[job.employmentType]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getJobStatusBadgeClass(job.status)}`}>
                    {statusLabels[job.status]}
                  </span>
                  {job.status === "DRAFT" && (
                    <form action={submitMyJobForReview}>
                      <input type="hidden" name="id" value={job.id} />
                      <button className="rounded-md border border-amber-300 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-50">
                        {dict.me.submitForReview}
                      </button>
                    </form>
                  )}
                  <Link href={`/jobs/${job.slug}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
                    {dict.common.viewJob}
                  </Link>
                </div>
              </div>
              {job.moderationNote && (
                <p className="mt-2 text-xs text-slate-600">
                  {dict.me.moderationNote}: {job.moderationNote}
                </p>
              )}
            </article>
          ))}

          {jobs.length === 0 && <p className="text-sm text-slate-600">{dict.me.noPostedJobs}</p>}
        </div>
      </section>
    </div>
  );
}


