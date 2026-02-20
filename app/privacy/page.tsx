import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "ro" ? "Politica de confidentialitate" : "Privacy Policy",
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const isRo = locale === "ro";

  return (
    <main className="w-full px-[var(--layout-gutter)] py-10">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="bg-[linear-gradient(120deg,#1f4e68_0%,#245f7e_55%,#17435a_100%)] px-7 py-10 text-white">
          <h1 className="font-[var(--font-sora)] text-3xl font-semibold">
            {isRo ? "Politica de confidentialitate" : "Privacy Policy"}
          </h1>
          <p className="mt-2 text-sm text-cyan-100">
            {isRo ? "Ultima actualizare: 19 februarie 2026" : "Last updated: February 19, 2026"}
          </p>
        </div>

        <div className="grid gap-6 px-7 py-7 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              {isRo ? "Cuprins" : "Contents"}
            </p>
            <nav className="mt-3 space-y-2 text-sm">
              <a href="#operator" className="block text-slate-700 hover:text-slate-900">{isRo ? "1. Operator date" : "1. Data controller"}</a>
              <a href="#date" className="block text-slate-700 hover:text-slate-900">{isRo ? "2. Date colectate" : "2. Data collected"}</a>
              <a href="#scop" className="block text-slate-700 hover:text-slate-900">{isRo ? "3. Scop si temei" : "3. Purpose and legal basis"}</a>
              <a href="#cookie" className="block text-slate-700 hover:text-slate-900">{isRo ? "4. Cookies" : "4. Cookies"}</a>
              <a href="#drepturi" className="block text-slate-700 hover:text-slate-900">{isRo ? "5. Drepturi" : "5. Rights"}</a>
              <a href="#retentie" className="block text-slate-700 hover:text-slate-900">{isRo ? "6. Retentie" : "6. Retention"}</a>
              <a href="#transfer" className="block text-slate-700 hover:text-slate-900">{isRo ? "7. Transferuri" : "7. Transfers"}</a>
              <a href="#contact" className="block text-slate-700 hover:text-slate-900">{isRo ? "8. Contact" : "8. Contact"}</a>
            </nav>
          </aside>

          <div className="space-y-6 text-sm text-slate-700">
            <section id="operator">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? "1. Operatorul de date" : "1. Data controller"}</h2>
              <p className="mt-1">
                {isRo
                  ? "NextJobs administreaza platforma pentru publicare anunturi, aplicari si management recrutare. Pentru intrebari privind datele personale, foloseste contactul din sectiunea de suport."
                  : "NextJobs operates the platform for job publishing, applications, and recruitment workflows. For personal data requests, use the support contact shown in the platform."}
              </p>
            </section>

            <section id="date">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? "2. Ce date colectam" : "2. What data we collect"}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>{isRo ? "Date de identificare: nume, email, rol cont, limba preferata." : "Identity data: name, email, account role, preferred language."}</li>
                <li>{isRo ? "Date profil: oras, nationalitate, data nasterii, CV, preferinte de munca." : "Profile data: city, nationality, birth date, CV, job preferences."}</li>
                <li>{isRo ? "Date operationale: joburi publicate, aplicatii, mesaje in conversatii." : "Operational data: posted jobs, applications, conversation messages."}</li>
                <li>{isRo ? "Date tehnice: IP, user-agent, loguri de securitate, erori aplicatie." : "Technical data: IP, user-agent, security logs, app errors."}</li>
              </ul>
            </section>

            <section id="scop">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? "3. Scop si temei legal" : "3. Purpose and legal basis"}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>{isRo ? "Executarea serviciului (contract): autentificare, profil, publicare joburi, aplicari." : "Service delivery (contract): auth, profile, job posting, applications."}</li>
                <li>{isRo ? "Interes legitim: securitate, prevenire abuz, audit operational." : "Legitimate interest: security, abuse prevention, operational audit."}</li>
                <li>{isRo ? "Consimtamant: cookies optionale si comunicari optionale." : "Consent: optional cookies and optional communications."}</li>
              </ul>
            </section>

            <section id="cookie">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? "4. Cookies si preferinte" : "4. Cookies and preferences"}</h2>
              <p className="mt-1">
                {isRo
                  ? "Preferintele de confidentialitate pot fi modificate oricand din butonul Privacy. Cookie-urile strict necesare sunt folosite pentru functionarea autentificarii si a sesiunilor."
                  : "Privacy preferences can be updated any time from the Privacy button. Strictly necessary cookies are used for authentication and session functionality."}
              </p>
            </section>

            <section id="drepturi">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? "5. Drepturile utilizatorului" : "5. User rights"}</h2>
              <p className="mt-1">
                {isRo
                  ? "Poti solicita acces, rectificare, stergere, restrictionare, portabilitate sau opozitie. Solicitarile se trateaza conform legislatiei aplicabile."
                  : "You can request access, rectification, erasure, restriction, portability, or objection. Requests are handled under applicable law."}
              </p>
            </section>

            <section id="retentie">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? "6. Perioada de retentie" : "6. Retention period"}</h2>
              <p className="mt-1">
                {isRo
                  ? "Datele sunt pastrate conform politicilor active din platforma (ex: aplicatii, drafturi, loguri), apoi anonimizate sau sterse."
                  : "Data is retained according to active platform policies (e.g., applications, drafts, logs), then anonymized or deleted."}
              </p>
            </section>

            <section id="transfer">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? "7. Transfer catre terti" : "7. Third-party transfers"}</h2>
              <p className="mt-1">
                {isRo
                  ? "Datele pot fi procesate de furnizori tehnici (hosting, email) strict pentru operarea serviciului, pe baza de obligatii contractuale."
                  : "Data may be processed by technical providers (hosting, email) strictly to operate the service under contractual safeguards."}
              </p>
            </section>

            <section id="contact">
              <h2 className="text-lg font-semibold text-slate-900">{isRo ? "8. Contact GDPR" : "8. GDPR contact"}</h2>
              <p className="mt-1">
                {isRo
                  ? "Pentru solicitari legate de date personale, foloseste adresa de suport afisata in footer sau pagina de contact."
                  : "For personal-data related requests, use the support address shown in footer or contact page."}
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
