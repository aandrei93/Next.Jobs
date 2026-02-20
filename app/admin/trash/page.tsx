import type { Metadata } from "next";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { restoreDeletedCategory, restoreDeletedCompany, restoreDeletedJob } from "@/lib/admin-actions";

export const metadata: Metadata = { title: "Trash" };

export default async function AdminTrashPage() {
  const locale = await getLocale();
  const isRo = locale === "ro";

  const [deletedJobs, deletedCompanies, deletedCategories] = await Promise.all([
    prisma.deletedJob.findMany({ where: { restoredAt: null }, orderBy: { deletedAt: "desc" }, take: 50 }),
    prisma.deletedCompany.findMany({ where: { restoredAt: null }, orderBy: { deletedAt: "desc" }, take: 50 }),
    prisma.deletedCategory.findMany({ where: { restoredAt: null }, orderBy: { deletedAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isRo ? "Cos de gunoi" : "Trash"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Elemente sterse soft-delete care pot fi restaurate." : "Soft-deleted items that can be restored."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Joburi sterse" : "Deleted jobs"}</h2>
        <div className="mt-3 space-y-2">
          {deletedJobs.map((item) => {
            const payload = JSON.parse(item.payloadJson) as { title?: string; company?: { name?: string } };
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{payload.title || item.originalId}</p>
                  <p className="text-xs text-slate-500">{payload.company?.name || "-"}</p>
                </div>
                <form action={restoreDeletedJob}>
                  <input type="hidden" name="deletedId" value={item.id} />
                  <ConfirmSubmitButton
                    confirmMessage={isRo ? "Restaurezi acest job?" : "Restore this job?"}
                    secureDelete
                    deleteKeywordPrompt={isRo ? "Scrie DELETE pentru confirmare:" : "Type DELETE to confirm:"}
                    passwordPrompt={isRo ? "Confirma parola ta de admin:" : "Confirm your admin password:"}
                    className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
                  >
                    {isRo ? "Restaureaza" : "Restore"}
                  </ConfirmSubmitButton>
                </form>
              </div>
            );
          })}
          {deletedJobs.length === 0 ? <p className="text-sm text-slate-600">{isRo ? "Nimic in cos." : "Trash is empty."}</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Companii sterse" : "Deleted companies"}</h2>
        <div className="mt-3 space-y-2">
          {deletedCompanies.map((item) => {
            const payload = JSON.parse(item.payloadJson) as { name?: string; location?: string };
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{payload.name || item.originalId}</p>
                  <p className="text-xs text-slate-500">{payload.location || "-"}</p>
                </div>
                <form action={restoreDeletedCompany}>
                  <input type="hidden" name="deletedId" value={item.id} />
                  <ConfirmSubmitButton
                    confirmMessage={isRo ? "Restaurezi aceasta companie?" : "Restore this company?"}
                    secureDelete
                    deleteKeywordPrompt={isRo ? "Scrie DELETE pentru confirmare:" : "Type DELETE to confirm:"}
                    passwordPrompt={isRo ? "Confirma parola ta de admin:" : "Confirm your admin password:"}
                    className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
                  >
                    {isRo ? "Restaureaza" : "Restore"}
                  </ConfirmSubmitButton>
                </form>
              </div>
            );
          })}
          {deletedCompanies.length === 0 ? <p className="text-sm text-slate-600">{isRo ? "Nimic in cos." : "Trash is empty."}</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Categorii sterse" : "Deleted categories"}</h2>
        <div className="mt-3 space-y-2">
          {deletedCategories.map((item) => {
            const payload = JSON.parse(item.payloadJson) as { name?: string };
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{payload.name || item.originalId}</p>
                </div>
                <form action={restoreDeletedCategory}>
                  <input type="hidden" name="deletedId" value={item.id} />
                  <ConfirmSubmitButton
                    confirmMessage={isRo ? "Restaurezi aceasta categorie?" : "Restore this category?"}
                    secureDelete
                    deleteKeywordPrompt={isRo ? "Scrie DELETE pentru confirmare:" : "Type DELETE to confirm:"}
                    passwordPrompt={isRo ? "Confirma parola ta de admin:" : "Confirm your admin password:"}
                    className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
                  >
                    {isRo ? "Restaureaza" : "Restore"}
                  </ConfirmSubmitButton>
                </form>
              </div>
            );
          })}
          {deletedCategories.length === 0 ? <p className="text-sm text-slate-600">{isRo ? "Nimic in cos." : "Trash is empty."}</p> : null}
        </div>
      </section>
    </div>
  );
}
