import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_CHANGELOG_VERSION, adminChangelog } from "@/lib/admin-changelog";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Admin Release Notes",
};

type AdminReleaseNotesPageProps = {
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

export default async function AdminReleaseNotesPage({ searchParams }: AdminReleaseNotesPageProps) {
  const rawSearchParams = await searchParams;
  const locale = await getLocale();
  const isRo = locale === "ro";
  const perPage = 15;
  const totalEntries = adminChangelog.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const pageRaw = Number(firstValue(rawSearchParams.page));
  const currentPage = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(totalPages, Math.floor(pageRaw)) : 1;
  const startIndex = (currentPage - 1) * perPage;
  const currentEntries = adminChangelog.slice(startIndex, startIndex + perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isRo ? "Release Notes Admin" : "Admin Release Notes"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo
            ? "Jurnal intern pentru schimbari operationale, infrastructura si fluxuri de administrare."
            : "Internal log for operational, infrastructure, and administration flow changes."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-700">
          {isRo ? "Versiune curenta admin:" : "Current admin version:"}{" "}
          <span className="font-semibold text-slate-900">{ADMIN_CHANGELOG_VERSION}</span>
        </p>
      </section>

      <section className="space-y-4">
        {currentEntries.map((entry) => (
          <article key={entry.version} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? entry.titleRo : entry.titleEn}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {entry.version} - {entry.date}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {(isRo ? entry.itemsRo : entry.itemsEn).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">
              {isRo ? "Pagina" : "Page"} {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={currentPage > 1 ? `/admin/release-notes?page=${currentPage - 1}` : "/admin/release-notes?page=1"}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  currentPage > 1
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "pointer-events-none border-slate-200 text-slate-400"
                }`}
                aria-disabled={currentPage <= 1}
              >
                {isRo ? "Anterior" : "Previous"}
              </Link>
              <Link
                href={currentPage < totalPages ? `/admin/release-notes?page=${currentPage + 1}` : `/admin/release-notes?page=${totalPages}`}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  currentPage < totalPages
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "pointer-events-none border-slate-200 text-slate-400"
                }`}
                aria-disabled={currentPage >= totalPages}
              >
                {isRo ? "Urmator" : "Next"}
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
