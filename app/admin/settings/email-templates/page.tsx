import type { Metadata } from "next";
import { AdminEmailTemplatesEditor } from "@/components/admin-email-templates-editor";
import { saveEmailTemplate } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";
import { EMAIL_TEMPLATE_KEYS, getDefaultEmailTemplateCatalog } from "@/lib/email-templates";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Email Templates" };

export default async function AdminEmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const locale = await getLocale();
  const isRo = locale === "ro";
  const rawSearchParams = await searchParams;
  const langParam = Array.isArray(rawSearchParams.lang) ? rawSearchParams.lang[0] : rawSearchParams.lang;
  const templateLocale: "ro" | "en" = langParam === "ro" ? "ro" : "en";
  const defaults = getDefaultEmailTemplateCatalog(templateLocale);
  const existing = await prisma.emailTemplate.findMany({
    where: { key: { in: [...EMAIL_TEMPLATE_KEYS] }, locale: templateLocale },
  });
  const existingMap = new Map(existing.map((item) => [item.key, item]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isRo ? "Template-uri Email" : "Email Templates"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo
            ? "Controleaza emailurile automate trimise la inregistrare, aplicari, mesaje si joburi noi."
            : "Control automated emails sent for registration, applications, messages, and new jobs."}
        </p>
      </div>

      <AdminEmailTemplatesEditor
        isRo={isRo}
        templateLocale={templateLocale}
        saveAction={saveEmailTemplate}
        templates={defaults.map((template) => {
          const item = existingMap.get(template.key);
          return {
            key: template.key,
            subject: item?.subject || template.subject,
            textBody: item?.textBody || template.textBody,
            htmlBody: item?.htmlBody || template.htmlBody || "",
            isEnabled: item?.isEnabled ?? template.isEnabled ?? true,
            isCustom: Boolean(item),
          };
        })}
      />
    </div>
  );
}
