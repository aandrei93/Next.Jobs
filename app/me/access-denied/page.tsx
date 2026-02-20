import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Access denied" };

type AccessDeniedPageProps = {
  searchParams: Promise<{ required?: string }>;
};

export default async function WorkspaceAccessDeniedPage({ searchParams }: AccessDeniedPageProps) {
  const locale = await getLocale();
  const isRo = locale === "ro";
  const params = await searchParams;
  const required = params.required === "employer" ? "employer" : "candidate";

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <h1 className="text-2xl font-bold text-rose-900">{isRo ? "Acces interzis" : "Access denied"}</h1>
      <p className="mt-2 text-sm text-rose-800">
        {required === "employer"
          ? isRo
            ? "Aceasta sectiune este disponibila doar pentru conturi de tip Angajator."
            : "This section is available only for Employer accounts."
          : isRo
            ? "Aceasta sectiune este disponibila doar pentru conturi de tip Candidat."
            : "This section is available only for Candidate accounts."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/me" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          {isRo ? "Inapoi in Workspace" : "Back to Workspace"}
        </Link>
        <Link href="/jobs" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          {isRo ? "Vezi joburi" : "Browse jobs"}
        </Link>
      </div>
    </div>
  );
}
