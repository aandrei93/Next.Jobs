import type { Metadata } from "next";
import { approveCategorySuggestion, createCategory, deleteCategory, rejectCategorySuggestion } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
export const metadata: Metadata = { title: "Categories" };


export default async function AdminCategoriesPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";

  const [categories, pendingSuggestions, recentSuggestions] = await Promise.all([
    prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { jobs: true } } },
    }),
    prisma.categorySuggestion.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        suggestedBy: { select: { name: true, email: true } },
        company: { select: { name: true } },
      },
      take: 30,
    }),
    prisma.categorySuggestion.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      include: {
        suggestedBy: { select: { name: true } },
      },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dict.admin.categories}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Categorii publice folosite in filtrare si organizare joburi." : "Public categories used for job filtering and organization."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.admin.createCategory}</h2>
        <form action={createCategory} className="mt-4 flex flex-wrap gap-3">
          <input name="name" required placeholder="Nume categorie" className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">{dict.admin.create}</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{isRo ? "Categorii propuse de companii" : "Company category proposals"}</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            {pendingSuggestions.length} {isRo ? "in asteptare" : "pending"}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {isRo
            ? "Companiile pot propune categorii noi. Dupa aprobare, categoria devine disponibila in formularele de job."
            : "Companies can suggest new categories. After approval, the category becomes available in job forms."}
        </p>
        <div className="mt-4 space-y-3">
          {pendingSuggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{suggestion.name}</p>
                  <p className="text-xs text-slate-500">
                    {isRo ? "Propus de" : "Suggested by"} {suggestion.suggestedBy.name || suggestion.suggestedBy.email}
                    {suggestion.company ? ` · ${suggestion.company.name}` : ""}
                  </p>
                </div>
              </div>
              {suggestion.details ? (
                <p className="mt-2 rounded-md bg-slate-50 px-2.5 py-2 text-sm text-slate-700">{suggestion.details}</p>
              ) : null}
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <form action={approveCategorySuggestion} className="space-y-2">
                  <input type="hidden" name="id" value={suggestion.id} />
                  <input
                    name="adminNote"
                    placeholder={isRo ? "Nota admin (optional)" : "Admin note (optional)"}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">
                    {isRo ? "Aproba categoria" : "Approve category"}
                  </button>
                </form>
                <form action={rejectCategorySuggestion} className="space-y-2">
                  <input type="hidden" name="id" value={suggestion.id} />
                  <input
                    name="adminNote"
                    placeholder={isRo ? "Motiv respingere (optional)" : "Reject reason (optional)"}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <ConfirmSubmitButton
                    confirmMessage={isRo ? "Sigur vrei sa respingi propunerea?" : "Are you sure you want to reject this proposal?"}
                    className="w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                  >
                    {isRo ? "Respinge" : "Reject"}
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          ))}
          {pendingSuggestions.length === 0 && (
            <p className="text-sm text-slate-600">{isRo ? "Nu exista propuneri in asteptare." : "No pending suggestions."}</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.admin.existingCategories}</h2>
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <article key={category.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-4">
              <div>
                <p className="font-semibold text-slate-900">{category.name}</p>
                <p className="text-xs text-slate-500">{category._count.jobs} {dict.admin.jobs.toLowerCase()}</p>
              </div>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={category.id} />
                <ConfirmSubmitButton
                  confirmMessage={isRo ? "Sigur vrei sa stergi categoria?" : "Are you sure you want to delete this category?"}
                  secureDelete
                  dialogTitle={isRo ? "Confirmare stergere categorie" : "Confirm category deletion"}
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
            </article>
          ))}
          {categories.length === 0 && <p className="text-sm text-slate-600">{dict.admin.noCategories}</p>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Istoric propuneri moderate" : "Moderated proposals history"}</h2>
        <div className="mt-4 space-y-2">
          {recentSuggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <p className="font-medium text-slate-900">
                {suggestion.name}{" "}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${suggestion.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                  {suggestion.status}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {isRo ? "Autor" : "Author"}: {suggestion.suggestedBy.name || "-"}
              </p>
              {suggestion.adminNote ? <p className="mt-1 text-xs text-slate-600">{suggestion.adminNote}</p> : null}
            </article>
          ))}
          {recentSuggestions.length === 0 ? (
            <p className="text-sm text-slate-600">{isRo ? "Nu exista istoric de moderare." : "No moderation history yet."}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}


