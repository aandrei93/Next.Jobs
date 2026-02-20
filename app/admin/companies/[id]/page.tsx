import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCompany, toggleCompanySuspension, toggleCompanyVerification } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getJobStatusBadgeClass, getJobStatusLabels } from "@/lib/jobs-query";

export const metadata: Metadata = { title: "Company details" };

type AdminCompanyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCompanyDetailPage({ params }: AdminCompanyDetailPageProps) {
  const [locale, { id }] = await Promise.all([getLocale(), params]);
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const jobStatusLabels = getJobStatusLabels(locale);

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, email: true, accountType: true } },
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { applications: true, savedBy: true } } },
      },
      _count: { select: { jobs: true } },
    },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {company.location} · {formatCompactMetric(company._count.jobs, locale)} {dict.admin.jobs.toLowerCase()}
          </p>
        </div>
        <Link href="/admin/companies" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
          {isRo ? "Inapoi la companii" : "Back to companies"}
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Detalii companie" : "Company details"}</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-semibold text-slate-900">{isRo ? "Owner" : "Owner"}:</span> {company.owner ? `${company.owner.name} (${company.owner.email})` : (isRo ? "Nealocat" : "Unassigned")}</p>
          <p><span className="font-semibold text-slate-900">{isRo ? "Tip owner" : "Owner type"}:</span> {company.owner ? (company.owner.accountType === "employer" ? (isRo ? "Angajator" : "Employer") : company.owner.accountType) : "-"}</p>
          <p><span className="font-semibold text-slate-900">{isRo ? "Verificare" : "Verification"}:</span> {company.verificationStatus}</p>
          <p><span className="font-semibold text-slate-900">{isRo ? "Suspendata" : "Suspended"}:</span> {company.isSuspended ? (isRo ? "Da" : "Yes") : (isRo ? "Nu" : "No")}</p>
          <p><span className="font-semibold text-slate-900">{isRo ? "Nr. inregistrare" : "Registration"}:</span> {company.registrationNumber || "-"}</p>
          <p><span className="font-semibold text-slate-900">{isRo ? "CUI / VAT" : "VAT / Tax ID"}:</span> {company.vatNumber || "-"}</p>
          <p><span className="font-semibold text-slate-900">{isRo ? "Industrie" : "Industry"}:</span> {company.industry || "-"}</p>
          <p><span className="font-semibold text-slate-900">{isRo ? "Marime" : "Size"}:</span> {company.companySize || "-"}</p>
          <p><span className="font-semibold text-slate-900">{isRo ? "Website" : "Website"}:</span> {company.website || "-"}</p>
          <p><span className="font-semibold text-slate-900">Logo URL:</span> {company.logoUrl || "-"}</p>
        </div>
        {company.description ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{company.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={toggleCompanyVerification}>
            <input type="hidden" name="id" value={company.id} />
            <input type="hidden" name="verify" value={company.verificationStatus === "VERIFIED" ? "0" : "1"} />
            <button className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
              {company.verificationStatus === "VERIFIED" ? (isRo ? "Scoate verificare" : "Unverify") : (isRo ? "Verifica" : "Verify")}
            </button>
          </form>
          <form action={toggleCompanySuspension}>
            <input type="hidden" name="id" value={company.id} />
            <input type="hidden" name="suspend" value={company.isSuspended ? "0" : "1"} />
            <button className="rounded-md border border-amber-300 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-50">
              {company.isSuspended ? (isRo ? "Reactiveaza" : "Unsuspend") : (isRo ? "Suspenda" : "Suspend")}
            </button>
          </form>
          <form action={deleteCompany}>
            <input type="hidden" name="id" value={company.id} />
            <ConfirmSubmitButton
              confirmMessage={isRo ? "Sigur vrei sa stergi compania?" : "Are you sure you want to delete this company?"}
              secureDelete
              dialogTitle={isRo ? "Confirmare stergere companie" : "Confirm company deletion"}
              deleteKeywordPrompt={isRo ? "Scrie DELETE pentru confirmare:" : "Type DELETE to confirm:"}
              passwordPrompt={isRo ? "Confirma parola ta de admin:" : "Confirm your admin password:"}
              cancelLabel={isRo ? "Renunta" : "Cancel"}
              confirmLabel={isRo ? "Confirma stergerea" : "Confirm deletion"}
              invalidSecureDeleteMessage={
                isRo
                  ? "Confirmarea este invalida. Scrie DELETE si introdu parola de admin."
                  : "Invalid confirmation. Type DELETE and provide your admin password."
              }
              className="rounded-md border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
            >
              {dict.admin.delete}
            </ConfirmSubmitButton>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Joburi companie" : "Company jobs"}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-3 py-2">{isRo ? "Titlu" : "Title"}</th>
                <th className="px-3 py-2">{isRo ? "Status" : "Status"}</th>
                <th className="px-3 py-2">{isRo ? "Vizualizari" : "Views"}</th>
                <th className="px-3 py-2">{dict.admin.applications}</th>
                <th className="px-3 py-2">{isRo ? "Actiune" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {company.jobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium text-slate-900">{job.title}</td>
                  <td className="px-3 py-3 text-slate-700">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getJobStatusBadgeClass(job.status)}`}>
                      {jobStatusLabels[job.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{formatCompactMetric(job.viewsCount, locale)}</td>
                  <td className="px-3 py-3 text-slate-700">{formatCompactMetric(job._count.applications, locale)}</td>
                  <td className="px-3 py-3">
                    <Link href={`/admin/jobs/${job.id}`} className="rounded-md border border-indigo-300 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50">
                      {isRo ? "Deschide job" : "Open job"}
                    </Link>
                  </td>
                </tr>
              ))}
              {company.jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    {isRo ? "Compania nu are joburi." : "This company has no jobs."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
