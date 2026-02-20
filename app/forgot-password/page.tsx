import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/security-actions";
import { getLocale } from "@/lib/i18n";

type ForgotPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "ro" ? "Recuperare parola" : "Forgot password" };
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPageProps) {
  const locale = await getLocale();
  const isRo = locale === "ro";
  const params = await searchParams;
  const status = params.status || "";

  return (
    <main className="w-full">
      <section
        className="w-full bg-cover bg-no-repeat bg-[position:center_30%] md:bg-[position:center_40%]"
        style={{ backgroundImage: "linear-gradient(120deg, rgba(15,63,90,0.9) 0%, rgba(30,94,125,0.84) 55%, rgba(18,61,86,0.9) 100%), url('/visuals/auth-photo-4.jpg')" }}
      >
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-10 pb-10 md:pt-12 md:pb-12">
          <div className="mx-auto max-w-[980px] rounded-2xl border border-white/25 bg-[#1b5571]/85 px-6 py-10 text-white md:px-8 md:py-12">
            <h1 className="text-center font-[var(--font-sora)] text-3xl font-semibold">
              {isRo ? "Ai uitat parola?" : "Forgot your password?"}
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-cyan-100">
              {isRo
                ? "Introdu adresa de email si iti trimitem un link de resetare."
                : "Enter your email and we will send you a reset link."}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:py-10">
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.6)]">
            {status === "sent" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {isRo ? "Daca emailul exista, linkul a fost trimis." : "If the email exists, a reset link has been sent."}
              </div>
            )}

            <form action={requestPasswordReset} className="mt-4 space-y-3">
              <input type="email" name="email" required placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                {isRo ? "Trimite link" : "Send reset link"}
              </button>
            </form>

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



