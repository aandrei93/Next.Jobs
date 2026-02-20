import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailToken } from "@/lib/security-actions";
import { getLocale } from "@/lib/i18n";

type VerifyPageProps = {
  searchParams: Promise<{ token?: string; status?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "ro" ? "Verificare email" : "Email verification" };
}

export default async function VerifyEmailPage({ searchParams }: VerifyPageProps) {
  const locale = await getLocale();
  const isRo = locale === "ro";
  const params = await searchParams;
  const token = params.token || "";
  const status = params.status || "";

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold">{isRo ? "Verificare email" : "Email verification"}</h1>
        {status === "ok" ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {isRo
              ? "Email verificat cu succes. Ti-am trimis acum si emailul de bun venit. Te poti autentifica."
              : "Email verified successfully. Your welcome email has now been sent. You can sign in."}
          </div>
        ) : status === "invalid" ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {isRo ? "Token invalid sau expirat." : "Invalid or expired token."}
          </div>
        ) : token ? (
          <form action={verifyEmailToken} className="mt-4 space-y-3">
            <input type="hidden" name="token" value={token} />
            <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              {isRo ? "Confirma email" : "Confirm email"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-600">{isRo ? "Lipseste tokenul de verificare." : "Verification token is missing."}</p>
        )}

        <p className="mt-4 text-sm text-slate-600">
          <Link href="/login" className="font-semibold text-slate-900">
            {isRo ? "Inapoi la login" : "Back to login"}
          </Link>
        </p>
      </div>
    </main>
  );
}
