import type { Metadata } from "next";
import { AdminSettingsTabs } from "@/components/admin-settings-tabs";
import { sendSmtpTestEmail, updateSiteSettings } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";

  const [settings, faviconAssets, recentTasks, settingsVersions] = await Promise.all([
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    prisma.mediaAsset.findMany({
      where: {
        OR: [{ kind: "icon" }, { kind: "image" }],
      },
      select: { url: true, label: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.adminTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
        errorText: true,
        outputJson: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
    prisma.siteSettingsVersion.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isRo ? "Setari platforma" : "Platform settings"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Controleaza regulile de publicare si configurarea de baza." : "Control posting rules and base configuration."}
        </p>
      </div>

      <AdminSettingsTabs
        isRo={isRo}
        settings={settings}
        faviconOptions={faviconAssets.map((item) => ({ url: item.url, label: item.label || item.url }))}
        updateAction={updateSiteSettings}
        smtpTestAction={sendSmtpTestEmail}
        recentTasks={recentTasks}
        settingsVersions={settingsVersions}
        saveLabel={dict.admin.saveChanges}
      />
    </div>
  );
}
