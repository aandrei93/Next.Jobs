import type { Metadata } from "next";
import Link from "next/link";
import { resetPassword } from "@/lib/security-actions";
import { getLocale } from "@/lib/i18n";

type ResetPageProps = {
  searchParams: Promise<{ token?: string; status?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "ro" ? "Resetare parola" : "Reset password" };
}

export default async function ResetPasswordPage({ searchParams }: ResetPageProps) {
  const locale = await getLocale();
  const isRo = locale === "ro";
  const params = await searchParams;
  const token = params.token || "";
  const status = params.status || "";

  return (
    <main className="w-full">
      <section
        className="w-full bg-cover bg-no-repeat bg-[position:center_34%] md:bg-[position:center_42%]"
        style={{ backgroundImage: "linear-gradient(120deg, rgba(15,63,90,0.9) 0%, rgba(30,94,125,0.84) 55%, rgba(18,61,86,0.9) 100%), url('/visuals/auth-photo-2.jpg')" }}
      >
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-10 pb-10 md:pt-12 md:pb-12">
          <div className="mx-auto max-w-[980px] rounded-2xl border border-white/25 bg-[#1b5571]/85 px-6 py-10 text-white md:px-8 md:py-12">
            <h1 className="text-center font-[var(--font-sora)] text-3xl font-semibold">
              {isRo ? "Seteaza parola noua" : "Set your new password"}
            </h1>
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:py-10">
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.6)]">
            {status === "invalid" && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {isRo ? "Token invalid sau expirat." : "Invalid or expired token."}
              </div>
            )}

            {!token ? (
              <p className="text-sm text-slate-600">{isRo ? "Lipseste tokenul de resetare." : "Reset token is missing."}</p>
            ) : (
              <form action={resetPassword} className="mt-2 space-y-3">
                <input type="hidden" name="token" value={token} />
                <input type="password" name="password" minLength={6} required placeholder={isRo ? "Parola noua" : "New password"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                  {isRo ? "Actualizeaza parola" : "Update password"}
                </button>
              </form>
            )}

            <p className="mt-4 text-sm text-slate-600">
              <Link href="/login" className="font-semibold text-slate-900">
                {isRo ? "Inapoi la login" : "Back to login"}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}



