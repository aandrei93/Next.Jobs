import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "ro" ? "Inregistrare" : "Register",
  };
}

export default async function RegisterPage() {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);
  const isRo = locale === "ro";

  if (session) {
    redirect("/jobs");
  }

  return (
    <main className="w-full">
      <section
        className="w-full bg-cover bg-no-repeat bg-[position:center_34%] md:bg-[position:center_48%]"
        style={{ backgroundImage: "linear-gradient(120deg, rgba(15,63,90,0.9) 0%, rgba(30,94,125,0.85) 55%, rgba(18,61,86,0.92) 100%), url('/visuals/auth-photo-1.jpg')" }}
      >
        <div className="mx-auto w-full max-w-[1500px] px-4 pt-10 pb-10 md:pt-12 md:pb-12">
          <div className="mx-auto max-w-[1060px] rounded-2xl border border-white/25 bg-[#1b5571]/85 px-6 py-12 text-white md:px-10 md:py-14">
            <h1 className="text-center font-[var(--font-sora)] text-3xl font-semibold text-white">
              {isRo ? "Inregistreaza-te in NextJobs" : "Join NextJobs"}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-200">
              {isRo
                ? "Alege tipul de cont potrivit si continua cu formularul dedicat."
                : "Choose the right account type and continue to its dedicated form."}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:py-10">
          <section className="grid gap-4 md:grid-cols-2 md:gap-5">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.55)]">
            <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900">
              {isRo ? "Cont Candidat" : "Candidate account"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isRo
                ? "Aplici la joburi, iti salvezi anunturi preferate si iti gestionezi CV-ul."
                : "Apply to jobs, save favorites, and manage your CV."}
            </p>
            <Link
              href="/register/employee"
              className="mt-6 inline-flex rounded-full bg-[#e97a27] px-6 py-2 text-sm font-semibold text-white hover:bg-[#d96b16]"
            >
              {isRo ? "Continua ca si candidat" : "Continue as candidate"}
            </Link>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.55)]">
            <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900">
              {isRo ? "Cont Angajator" : "Employer account"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isRo
                ? "Publici anunturi de job, gestionezi aplicari si comunici cu candidatii."
                : "Publish jobs, manage applications, and message candidates."}
            </p>
            <Link
              href="/register/employer"
              className="mt-6 inline-flex rounded-full bg-[#e97a27] px-6 py-2 text-sm font-semibold text-white hover:bg-[#d96b16]"
            >
              {isRo ? "Continua ca si angajator" : "Continue as employer"}
            </Link>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}

