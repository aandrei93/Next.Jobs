import { getLocale } from "@/lib/i18n";

export default async function TermsPage() {
  const locale = await getLocale();
  const isRo = locale === "ro";

  return (
    <main className="w-full px-[var(--layout-gutter)] py-8">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
        <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-slate-900">
          {isRo ? "Termeni si conditii" : "Terms and conditions"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          {isRo
            ? "Acesta este un rezumat al termenilor de utilizare pentru platforma Next.Jobs. Prin folosirea platformei, accepti utilizarea responsabila a contului, respectarea regulilor de publicare si comunicare, precum si obligatia de a furniza informatii corecte."
            : "This page provides a summary of the terms of use for the Next.Jobs platform. By using the platform, you accept responsible account usage, compliance with posting and communication rules, and the obligation to provide accurate information."}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          {isRo
            ? "Administratorul poate modifica functionalitatile, limita accesul abuziv si aplica politici de moderare pentru mentinerea calitatii serviciului."
            : "The administrator may update features, limit abusive access, and enforce moderation policies to maintain service quality."}
        </p>
      </section>
    </main>
  );
}
