import { getLocale } from "@/lib/i18n";

export default async function CookiesPage() {
  const locale = await getLocale();
  const isRo = locale === "ro";

  return (
    <main className="w-full px-[var(--layout-gutter)] py-8">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
        <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-slate-900">
          {isRo ? "Politica cookies" : "Cookies policy"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          {isRo
            ? "Platforma utilizeaza cookie-uri esentiale pentru autentificare, preferinte de limba si functionarea fluxurilor principale."
            : "The platform uses essential cookies for authentication, language preferences, and core workflow functionality."}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          {isRo
            ? "Cookie-urile de analiza sau tracking pot fi activate doar daca sunt configurate explicit de administrator."
            : "Analytics or tracking cookies may be enabled only if explicitly configured by the administrator."}
        </p>
      </section>
    </main>
  );
}
