import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentSession } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";

type LoginPageProps = {
  searchParams: Promise<{ verify?: string; reset?: string; logout_all?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "ro" ? "Autentificare" : "Login",
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);
  const params = await searchParams;

  if (session) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/jobs");
  }

  const dict = await getDictionary(locale);
  const isRo = locale === "ro";

  return (
    <main className="w-full">
      <section
        className="w-full bg-cover bg-no-repeat bg-[position:center_24%] md:bg-[position:center_46%]"
        style={{ backgroundImage: "linear-gradient(120deg, rgba(15,63,90,0.9) 0%, rgba(30,94,125,0.84) 55%, rgba(18,61,86,0.9) 100%), url('/visuals/auth-photo-3.jpg')" }}
      >
        <div className="mx-auto w-full max-w-[1500px] px-4 pt-10 pb-10 md:pt-12 md:pb-12">
          <div className="mx-auto max-w-[1060px] rounded-2xl border border-white/25 bg-[#1b5571] px-6 py-10 text-white md:px-8 md:py-12">
            <h1 className="font-[var(--font-sora)] text-3xl font-semibold">
              {isRo ? "Bine ai revenit" : "Welcome back"}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-200">
              {isRo
                ? "Autentifica-te pentru a gestiona joburi, aplicari, CV-ul si conversatiile cu angajatori sau candidati."
                : "Sign in to manage jobs, applications, your CV, and conversations with employers or candidates."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/register/employee" className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">
                {isRo ? "Cont candidat" : "Candidate account"}
              </Link>
              <Link href="/register/employer" className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">
                {isRo ? "Cont angajator" : "Employer account"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:py-10">
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.6)]">
            <h2 className="text-2xl font-bold text-slate-900">{dict.login.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{dict.login.subtitle}</p>

            {params.verify === "1" && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {isRo ? "Cont creat. Verifica emailul inainte de login." : "Account created. Verify your email before signing in."}
              </div>
            )}
            {params.reset === "1" && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {isRo ? "Parola a fost resetata. Te poti autentifica." : "Password reset completed. You can sign in now."}
              </div>
            )}
            {params.logout_all === "1" && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {isRo ? "Toate sesiunile anterioare au fost invalidate." : "All previous sessions were invalidated."}
              </div>
            )}

            <div className="mt-5">
              <LoginForm
                labels={{
                  email: dict.register.emailPlaceholder,
                  password: dict.login.passwordPlaceholder,
                  otp: isRo ? "Cod 2FA (admin)" : "2FA code (admin)",
                  requestOtp: isRo ? "Trimite cod" : "Send code",
                  otpSent: isRo ? "Codul a fost trimis pe emailul admin." : "Code sent to admin email.",
                  invalidCredentials: dict.login.invalidCredentials,
                  signingIn: dict.login.signingIn,
                  submit: dict.nav.login,
                }}
              />
            </div>

            <p className="mt-4 text-sm text-slate-600">
              {dict.login.noAccount}{" "}
              <Link href="/register" className="font-semibold text-slate-900">
                {isRo ? "Creeaza cont" : "Create account"}
              </Link>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              <Link href="/forgot-password" className="font-semibold text-slate-900">
                {isRo ? "Ai uitat parola?" : "Forgot password?"}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}


