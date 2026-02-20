import type { Metadata } from "next";
import Link from "next/link";
import { frontendChangelog, FRONTEND_VERSION } from "@/lib/frontend-changelog";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Frontend Release Notes",
};

type FrontendChangelogPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

function getFirstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function FrontendChangelogPage({ searchParams }: FrontendChangelogPageProps) {
  const rawParams = await searchParams;
  const locale = await getLocale();
  const isRo = locale === "ro";
  const perPage = 15;
  const totalEntries = frontendChangelog.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const pageRaw = Number(getFirstValue(rawParams.page));
  const currentPage = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(totalPages, Math.floor(pageRaw)) : 1;
  const startIndex = (currentPage - 1) * perPage;
  const currentEntries = frontendChangelog.slice(startIndex, startIndex + perPage);

  return (
    <main className="w-full px-[var(--layout-gutter)] py-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
        <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-900">
          {isRo ? "Release notes publice" : "Public release notes"}
        </p>
        <h1 className="mt-3 font-[var(--font-sora)] text-3xl font-semibold text-slate-900 md:text-4xl">
          {isRo ? "Frontend Release Notes" : "Frontend Release Notes"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isRo
            ? "Aici publicam doar modificari frontend accesibile utilizatorilor. Modificarile backend si Admin Panel sunt excluse."
            : "Only user-facing frontend (UI/UX) updates are published here. Backend and Admin Panel changes are excluded."}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {isRo ? "Versiune curenta frontend:" : "Current frontend version:"} {FRONTEND_VERSION}
        </p>
      </section>

      <section className="mt-5 space-y-4">
        {currentEntries.map((entry) => (
          <article key={entry.version} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-[var(--font-sora)] text-xl font-semibold text-slate-900">
                {isRo ? entry.titleRo : entry.titleEn}
              </h2>
              <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {entry.version} - {entry.date}
              </p>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(isRo ? entry.itemsRo : entry.itemsEn).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">
              {isRo ? "Pagina" : "Page"} {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={currentPage > 1 ? `/changelog?page=${currentPage - 1}` : `/changelog?page=1`}
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
                href={currentPage < totalPages ? `/changelog?page=${currentPage + 1}` : `/changelog?page=${totalPages}`}
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
    </main>
  );
}
