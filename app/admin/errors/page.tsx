import type { Metadata } from "next";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { clearErrorLogs } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Error Logs" };

type AdminErrorsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminErrorsPage({ searchParams }: AdminErrorsPageProps) {
  const [locale, rawParams] = await Promise.all([getLocale(), searchParams]);
  const isRo = locale === "ro";

  const pageRaw = Number(firstValue(rawParams.page));
  const currentPage = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const perPage = 20;
  const skip = (currentPage - 1) * perPage;

  const [total, logs] = await Promise.all([
    prisma.errorLog.count(),
    prisma.errorLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(currentPage, totalPages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isRo ? "Jurnal erori" : "Error logs"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo
            ? "Erorile runtime raportate de utilizatori sunt salvate aici pentru investigare."
            : "Runtime errors reported by users are stored here for investigation."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
          <p>
            {isRo ? "Total erori:" : "Total errors:"} <span className="font-semibold text-slate-900">{total}</span>
          </p>
          <div className="flex items-center gap-3">
            <p>
              {isRo ? "Pagina" : "Page"} {page} / {totalPages}
            </p>
            <form action={clearErrorLogs}>
              <ConfirmSubmitButton
                className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                confirmMessage={
                  isRo
                    ? "Sigur vrei sa stergi toate logurile de erori? Actiunea nu poate fi anulata."
                    : "Are you sure you want to delete all error logs? This action cannot be undone."
                }
                secureDelete
                dialogTitle={isRo ? "Confirmare stergere loguri" : "Confirm log deletion"}
                deleteKeywordPrompt={isRo ? "Scrie DELETE pentru confirmare:" : "Type DELETE to confirm:"}
                passwordPrompt={isRo ? "Confirma parola ta de admin:" : "Confirm your admin password:"}
                cancelLabel={isRo ? "Renunta" : "Cancel"}
                confirmLabel={isRo ? "Confirma stergerea" : "Confirm deletion"}
                invalidSecureDeleteMessage={
                  isRo
                    ? "Confirmarea este invalida. Scrie DELETE si introdu parola de admin."
                    : "Invalid confirmation. Type DELETE and provide your admin password."
                }
              >
                {isRo ? "Curata toate logurile" : "Clear all logs"}
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <article key={log.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{log.message}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {log.source}
                </span>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                <p>
                  <span className="font-medium text-slate-800">{isRo ? "Data:" : "Date:"}</span>{" "}
                  {log.createdAt.toLocaleString(isRo ? "ro-RO" : "en-GB")}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Path:</span> {log.path || "-"}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Digest:</span> {log.digest || "-"}
                </p>
                <p>
                  <span className="font-medium text-slate-800">{isRo ? "Utilizator:" : "User:"}</span>{" "}
                  {log.user ? `${log.user.name} (${log.user.email})` : "-"}
                </p>
              </div>
              {log.name ? (
                <p className="mt-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{isRo ? "Tip eroare:" : "Error type:"}</span> {log.name}
                </p>
              ) : null}
              {log.stack ? (
                <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                  <summary className="cursor-pointer font-medium">{isRo ? "Stack trace" : "Stack trace"}</summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words">{log.stack}</pre>
                </details>
              ) : null}
              {log.userAgent ? (
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">UA:</span> {log.userAgent}
                </p>
              ) : null}
            </article>
          ))}

          {!logs.length ? <p className="text-sm text-slate-600">{isRo ? "Nu exista erori raportate." : "No error logs yet."}</p> : null}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-end gap-2">
            <a
              href={page > 1 ? `/admin/errors?page=${page - 1}` : "/admin/errors?page=1"}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                page > 1 ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "pointer-events-none border-slate-200 text-slate-400"
              }`}
            >
              {isRo ? "Anterior" : "Previous"}
            </a>
            <a
              href={page < totalPages ? `/admin/errors?page=${page + 1}` : `/admin/errors?page=${totalPages}`}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                page < totalPages ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "pointer-events-none border-slate-200 text-slate-400"
              }`}
            >
              {isRo ? "Urmator" : "Next"}
            </a>
          </div>
        ) : null}
      </section>
    </div>
  );
}
