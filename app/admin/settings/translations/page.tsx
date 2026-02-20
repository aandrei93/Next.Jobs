import type { Metadata } from "next";
import { AdminTranslationsPanel } from "@/components/admin-translations-panel";
import { updateTranslationsBulk } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale, getTranslationCatalog } from "@/lib/i18n";

export const metadata: Metadata = { title: "Translations" };

export default async function AdminSettingsTranslationsPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";

  const translationOverrides = await prisma.localeTranslation.findMany({
    where: { locale: { in: ["ro", "en"] } },
    select: { locale: true, key: true, value: true },
  });
  const catalog = getTranslationCatalog();
  const overrideMap = Object.fromEntries(translationOverrides.map((item) => [`${item.locale}::${item.key}`, item.value]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isRo ? "Traduceri platforma" : "Platform translations"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo
            ? "Gestioneaza textele RO/EN direct din admin. Cheile fara override folosesc traducerea implicita din cod."
            : "Manage RO/EN texts directly from admin. Keys without overrides use default in-code translations."}
        </p>
      </div>

      <AdminTranslationsPanel isRo={isRo} catalog={catalog} overrides={overrideMap} updateAction={updateTranslationsBulk} />

      <p className="text-xs text-slate-500">
        {isRo ? "Salvare actiune: " : "Save action: "}
        <span className="font-semibold text-slate-700">{dict.admin.saveChanges}</span>
      </p>
    </div>
  );
}

