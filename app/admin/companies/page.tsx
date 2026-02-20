import type { Metadata } from "next";
import Link from "next/link";
import { deleteCompany, toggleCompanySuspension, toggleCompanyVerification } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Companies" };

export default async function AdminCompaniesPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";

  const companies = await prisma.company.findMany({
    where: {
      OR: [{ owner: null }, { owner: { accountType: "employer" } }],
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { jobs: true } }, owner: { select: { name: true, email: true, accountType: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dict.admin.companies}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Gestioneaza companiile afisate pe marketplace." : "Manage companies displayed on the marketplace."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.admin.existingCompanies}</h2>
        <div className="mt-4 space-y-3">
          {companies.map((company) => (
            <article key={company.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-4">
              <div>
                <p className="font-semibold text-slate-900">{company.name}</p>
                <p className="text-xs text-slate-500">
                  {company.location} - {formatCompactMetric(company._count.jobs, locale)} {dict.admin.jobs.toLowerCase()}
                </p>
                {company.owner ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {isRo ? "Owner:" : "Owner:"} {company.owner.name} ({company.owner.email}) -{" "}
                    <span className="font-semibold text-slate-700">{isRo ? "Angajator" : "Employer"}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">{isRo ? "Owner: nealocat" : "Owner: unassigned"}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {isRo ? "Verificare:" : "Verification:"}{" "}
                  <span className={company.verificationStatus === "VERIFIED" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                    {company.verificationStatus === "VERIFIED" ? (isRo ? "Verificata" : "Verified") : (isRo ? "In asteptare" : "Pending")}
                  </span>
                </p>
                {company.logoUrl && <p className="text-xs text-slate-500">{company.logoUrl}</p>}
                {company.isSuspended && (
                  <p className="mt-1 inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                    {isRo ? "Suspendata" : "Suspended"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/companies/${company.id}`} className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50">
                  {dict.admin.view}
                </Link>
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
            </article>
          ))}
          {companies.length === 0 && <p className="text-sm text-slate-600">{dict.admin.noCompanies}</p>}
        </div>
      </section>
    </div>
  );
}

