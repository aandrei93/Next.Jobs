import type { Metadata } from "next";
import Link from "next/link";
import { Eye, FileSearch, Pencil, Trash2 } from "lucide-react";
import { JobStatus, type Prisma } from "@prisma/client";
import { deleteJob } from "@/lib/admin-actions";
import { AdminCreateJobModal } from "@/components/admin-create-job-modal";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getJobStatusBadgeClass, getJobStatusLabels } from "@/lib/jobs-query";

export const metadata: Metadata = { title: "Jobs" };

const PAGE_SIZE = 12;

type AdminJobsPageProps = {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[]; status?: string | string[]; company?: string | string[]; ownerType?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminJobsPage({ searchParams }: AdminJobsPageProps) {
  const [locale, rawSearchParams] = await Promise.all([getLocale(), searchParams]);
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const jobStatusLabels = getJobStatusLabels(locale);
  const formatMetric = (value: number) => formatCompactMetric(value, locale);
  const q = firstValue(rawSearchParams.q).trim();
  const selectedStatus = firstValue(rawSearchParams.status).trim();
  const selectedCompanyId = firstValue(rawSearchParams.company).trim();
  const selectedOwnerType = firstValue(rawSearchParams.ownerType).trim();
  const activeStatus = Object.values(JobStatus).includes(selectedStatus as JobStatus) ? (selectedStatus as JobStatus) : "";
  const activeCompanyId = selectedCompanyId;
  const activeOwnerType = selectedOwnerType === "candidate" || selectedOwnerType === "employer" ? selectedOwnerType : "";

  const whereFilters: Prisma.JobWhereInput[] = [];
  if (q) {
    whereFilters.push({
      OR: [
        { title: { contains: q } },
        { summary: { contains: q } },
        { location: { contains: q } },
        { company: { name: { contains: q } } },
        { createdBy: { name: { contains: q } } },
        { createdBy: { email: { contains: q } } },
      ],
    });
  }
  if (activeStatus) {
    whereFilters.push({ status: activeStatus });
  }
  if (activeCompanyId) {
    whereFilters.push({ companyId: activeCompanyId });
  }
  if (activeOwnerType) {
    whereFilters.push({ createdBy: { accountType: activeOwnerType } });
  }
  const jobsWhere: Prisma.JobWhereInput = whereFilters.length ? { AND: whereFilters } : {};

  const pageRaw = Number(firstValue(rawSearchParams.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const skip = (page - 1) * PAGE_SIZE;

  const [
    jobsTable,
    totalJobs,
    publishedJobs,
    applicationsCount,
    viewsAggregate,
    pendingJobs,
    companies,
    categories,
  ] = await Promise.all([
    prisma.job.findMany({
      where: jobsWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        company: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { applications: true, savedBy: true } },
      },
    }),
    prisma.job.count({ where: jobsWhere }),
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.application.count(),
    prisma.job.aggregate({ _sum: { viewsCount: true } }),
    prisma.job.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { company: true, createdBy: { select: { name: true, email: true } } },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalJobs / PAGE_SIZE));
  const paramsBase = new URLSearchParams();
  if (q) paramsBase.set("q", q);
  if (activeStatus) paramsBase.set("status", activeStatus);
  if (activeCompanyId) paramsBase.set("company", activeCompanyId);
  if (activeOwnerType) paramsBase.set("ownerType", activeOwnerType);
  const locationSuggestions = Array.from(
    new Set([...jobsTable.map((item) => item.location), ...companies.map((item) => item.location)])
  ).sort((a, b) => a.localeCompare(b));

  const stats = [
    { label: isRo ? "Total joburi" : "Total jobs", value: formatMetric(totalJobs) },
    { label: isRo ? "Publicate" : "Published", value: formatMetric(publishedJobs) },
    { label: isRo ? "Vizualizari totale" : "Total views", value: formatMetric(viewsAggregate._sum.viewsCount || 0) },
    { label: isRo ? "Aplicari totale" : "Total applications", value: formatMetric(applicationsCount) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dict.admin.jobs}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Tablou complet cu joburi, proprietari si metrici utile." : "Full jobs table with owners and key metrics."}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{dict.admin.createJob}</h2>
            <p className="text-sm text-slate-600">
              {isRo ? "Creare job doar prin modal, pentru un panel admin mai curat." : "Create jobs through modal only for a cleaner admin panel."}
            </p>
          </div>
          <AdminCreateJobModal
            locale={locale}
            companies={companies.map((company) => ({
              id: company.id,
              name: company.name,
              location: company.location,
              isSuspended: company.isSuspended,
              verificationStatus: company.verificationStatus,
            }))}
            categories={categories.map((category) => ({ id: category.id, name: category.name }))}
            locationSuggestions={locationSuggestions}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.admin.pendingReviewJobs}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-3 py-2">{isRo ? "Job" : "Job"}</th>
                <th className="px-3 py-2">{dict.admin.companies}</th>
                <th className="px-3 py-2">{isRo ? "Owner" : "Owner"}</th>
                <th className="px-3 py-2">{isRo ? "Locatie" : "Location"}</th>
                <th className="px-3 py-2">{isRo ? "Creat la" : "Created at"}</th>
                <th className="px-3 py-2">{isRo ? "Actiune" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
          {pendingJobs.map((job) => (
            <tr key={job.id} className="border-b border-slate-100">
              <td className="px-3 py-3">
                <p className="font-medium text-slate-900">{job.title}</p>
                <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  {dict.me.pendingReview}
                </span>
              </td>
              <td className="px-3 py-3 text-slate-700">{job.company.name}</td>
              <td className="px-3 py-3 text-slate-700">
                <p>{job.createdBy.name}</p>
                <p className="text-xs text-slate-500">{job.createdBy.email}</p>
              </td>
              <td className="px-3 py-3 text-slate-700">{job.location}</td>
              <td className="px-3 py-3 text-slate-600">{job.createdAt.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB")}</td>
              <td className="px-3 py-3">
                <Link
                  href={`/admin/jobs/${job.id}`}
                  aria-label={isRo ? "Deschide review" : "Open review"}
                  className="group relative inline-flex items-center justify-center rounded-md border border-indigo-300 px-2.5 py-1.5 text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <FileSearch className="size-4" />
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    {isRo ? "Deschide review" : "Open review"}
                  </span>
                </Link>
              </td>
            </tr>
          ))}
            {pendingJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">
                  {dict.admin.noPendingReviewJobs}
                </td>
              </tr>
            ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.admin.existingJobs}</h2>
        <form className="mt-4 grid gap-2 md:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder={isRo ? "Cauta job / user / companie..." : "Search job / user / company..."}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select name="status" defaultValue={activeStatus} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">{isRo ? "Toate statusurile" : "All statuses"}</option>
            {Object.values(JobStatus).map((status) => (
              <option key={status} value={status}>
                {jobStatusLabels[status]}
              </option>
            ))}
          </select>
          <select name="company" defaultValue={activeCompanyId} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">{isRo ? "Toate companiile" : "All companies"}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <select name="ownerType" defaultValue={activeOwnerType} className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2">
            <option value="">{isRo ? "Toti proprietarii" : "All owners"}</option>
            <option value="candidate">{isRo ? "Doar candidati" : "Candidates only"}</option>
            <option value="employer">{isRo ? "Doar angajatori" : "Employers only"}</option>
          </select>
          <input type="hidden" name="page" value="1" />
          <div className="md:col-span-4 flex gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
              {isRo ? "Aplica filtre" : "Apply filters"}
            </button>
            <Link href="/admin/jobs" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
              {isRo ? "Reseteaza" : "Reset"}
            </Link>
          </div>
        </form>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-3 py-2">{isRo ? "Job" : "Job"}</th>
                <th className="px-3 py-2">{isRo ? "Utilizator" : "User"}</th>
                <th className="px-3 py-2">{dict.admin.companies}</th>
                <th className="px-3 py-2">{isRo ? "Status" : "Status"}</th>
                <th className="px-3 py-2">{isRo ? "Vizualizari" : "Views"}</th>
                <th className="px-3 py-2">{dict.admin.applications}</th>
                <th className="px-3 py-2">{isRo ? "Salvate" : "Saved"}</th>
                <th className="px-3 py-2">{isRo ? "Actualizat" : "Updated"}</th>
                <th className="px-3 py-2">{isRo ? "Actiuni" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {jobsTable.map((job) => (
                <tr key={job.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">
                    <Link href={`/admin/jobs/${job.id}`} className="font-medium text-slate-900 underline-offset-2 hover:underline">
                      {job.title}
                    </Link>
                    <p className="text-xs text-slate-500">{job.location}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <p>{job.createdBy.name}</p>
                    <p className="text-xs text-slate-500">{job.createdBy.email}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{job.company.name}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getJobStatusBadgeClass(job.status)}`}>{jobStatusLabels[job.status]}</span>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-800">{formatCompactMetric(job.viewsCount, locale)}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">{formatMetric(job._count.applications)}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">{formatMetric(job._count.savedBy)}</td>
                  <td className="px-3 py-3 text-slate-600">{job.updatedAt.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB")}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        aria-label={isRo ? "Detalii + aplicatii" : "Details + applications"}
                        className="group relative inline-flex items-center justify-center rounded-md border border-indigo-300 px-2.5 py-1.5 text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <Eye className="size-4" />
                        <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                          {isRo ? "Detalii + aplicatii" : "Details + applications"}
                        </span>
                      </Link>
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        aria-label={isRo ? "Editeaza job" : "Edit job"}
                        className="group relative inline-flex items-center justify-center rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <Pencil className="size-4" />
                        <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                          {isRo ? "Editeaza job" : "Edit job"}
                        </span>
                      </Link>
                      <form action={deleteJob}>
                        <input type="hidden" name="id" value={job.id} />
                        <ConfirmSubmitButton
                          confirmMessage={isRo ? "Sigur vrei sa stergi jobul?" : "Are you sure you want to delete this job?"}
                          secureDelete
                          deleteKeywordPrompt={isRo ? "Scrie DELETE pentru confirmare:" : "Type DELETE to confirm:"}
                          passwordPrompt={isRo ? "Confirma parola ta de admin:" : "Confirm your admin password:"}
                          ariaLabel={isRo ? "Sterge job" : "Delete job"}
                          className="group relative inline-flex items-center justify-center rounded-md border border-rose-300 px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          <>
                            <Trash2 className="size-4" />
                            <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                              {isRo ? "Sterge job" : "Delete job"}
                            </span>
                          </>
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {jobsTable.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-sm text-slate-500">
                    {isRo ? "Nu exista joburi pentru filtrele selectate." : "No jobs match the selected filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {isRo ? "Pagina" : "Page"} {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/admin/jobs?${(() => {
                const prev = new URLSearchParams(paramsBase.toString());
                prev.set("page", String(Math.max(1, page - 1)));
                return prev.toString();
              })()}`}
              className={`rounded-md border px-3 py-1.5 text-sm ${page <= 1 ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
            >
              {dict.jobs.prev}
            </Link>
            <Link
              href={`/admin/jobs?${(() => {
                const next = new URLSearchParams(paramsBase.toString());
                next.set("page", String(Math.min(totalPages, page + 1)));
                return next.toString();
              })()}`}
              className={`rounded-md border px-3 py-1.5 text-sm ${page >= totalPages ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
            >
              {dict.jobs.next}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


