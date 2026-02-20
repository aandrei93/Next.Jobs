"use client";

import { useState } from "react";
import { Database, FlaskConical, Link2, Megaphone, Settings2, ShieldCheck, Upload, Wrench } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SiteSettings } from "@prisma/client";

type AdminSettingsTabsProps = {
  isRo: boolean;
  settings: SiteSettings;
  faviconOptions: Array<{ url: string; label: string }>;
  updateAction: (formData: FormData) => Promise<void>;
  smtpTestAction: (formData: FormData) => Promise<void>;
  recentTasks: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    errorText: string | null;
    outputJson: string | null;
    createdBy: { name: string | null; email: string };
  }>;
  settingsVersions: Array<{
    id: string;
    reason: string | null;
    createdAt: Date;
    createdBy: { name: string | null; email: string } | null;
  }>;
  saveLabel: string;
};

type TabKey = "identity" | "jobs" | "security" | "seo" | "integrations" | "features" | "retention" | "operations";
const TAB_KEYS: TabKey[] = ["identity", "jobs", "security", "seo", "integrations", "features", "retention", "operations"];

function isTabKey(value: string | null): value is TabKey {
  return value !== null && TAB_KEYS.includes(value as TabKey);
}

function parseTaskOutput(outputJson: string | null) {
  if (!outputJson) return null;
  try {
    return JSON.parse(outputJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

export function AdminSettingsTabs({
  isRo,
  settings,
  faviconOptions,
  updateAction,
  smtpTestAction,
  recentTasks,
  settingsVersions,
  saveLabel,
}: AdminSettingsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab: TabKey = isTabKey(tabFromUrl) ? tabFromUrl : "identity";
  const [adminDashboardDefaultRange, setAdminDashboardDefaultRange] = useState(
    (settings as SiteSettings & { adminDashboardDefaultRange?: string }).adminDashboardDefaultRange || "7d"
  );
  const [homeFeaturedJobsCount, setHomeFeaturedJobsCount] = useState(
    (settings as SiteSettings & { homeFeaturedJobsCount?: number }).homeFeaturedJobsCount || 8
  );
  const [jobsDefaultPostedFilter, setJobsDefaultPostedFilter] = useState(
    (settings as SiteSettings & { jobsDefaultPostedFilter?: string }).jobsDefaultPostedFilter || "any"
  );
  const [smtpTestEmail, setSmtpTestEmail] = useState(settings.supportEmail || settings.contactEmail || "");
  const [includeUploadsInExport, setIncludeUploadsInExport] = useState(true);
  const [replaceUploadsOnImport, setReplaceUploadsOnImport] = useState(false);
  const [backupImportFile, setBackupImportFile] = useState<File | null>(null);
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  const [isRunningSmoke, setIsRunningSmoke] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [smokeOutput, setSmokeOutput] = useState<string>("");

  function changeTab(nextTab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function handleImportBackup() {
    if (!backupImportFile) {
      setOperationError(isRo ? "Selecteaza arhiva backup (.zip)." : "Select a backup archive (.zip).");
      setOperationMessage(null);
      return;
    }

    const confirmed = window.confirm(
      isRo
        ? "Importul backup-ului va inlocui baza de date curenta. Continui?"
        : "Backup import will replace the current database. Continue?"
    );
    if (!confirmed) {
      return;
    }

    try {
      setIsImportingBackup(true);
      setOperationError(null);
      setOperationMessage(null);

      const payload = new FormData();
      payload.set("file", backupImportFile);
      payload.set("replaceUploads", replaceUploadsOnImport ? "1" : "0");

      const response = await fetch("/api/admin/backups/import", {
        method: "POST",
        body: payload,
      });
      const data = (await response.json()) as { ok?: boolean; restoredUploads?: number; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "backup_import_failed");
      }

      setOperationMessage(
        isRo
          ? `Backup importat cu succes. Fisiere upload restaurate: ${data.restoredUploads || 0}.`
          : `Backup imported successfully. Restored uploaded files: ${data.restoredUploads || 0}.`
      );
      setBackupImportFile(null);
    } catch {
      setOperationError(
        isRo
          ? "Importul backup-ului a esuat. Verifica formatul arhivei si incearca din nou."
          : "Backup import failed. Check archive format and try again."
      );
      setOperationMessage(null);
    } finally {
      setIsImportingBackup(false);
    }
  }

  async function runSmokeTests() {
    try {
      setIsRunningSmoke(true);
      setOperationError(null);
      setOperationMessage(null);
      setSmokeOutput("");

      const response = await fetch("/api/admin/smoke/run", {
        method: "POST",
      });
      const data = (await response.json()) as { ok?: boolean; output?: string; error?: string };
      setSmokeOutput(data.output || "");

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "smoke_failed");
      }

      setOperationMessage(isRo ? "Smoke tests au trecut cu succes." : "Smoke tests passed successfully.");
    } catch {
      setOperationError(isRo ? "Smoke tests au esuat." : "Smoke tests failed.");
    } finally {
      setIsRunningSmoke(false);
    }
  }

  async function createBackupSnapshot() {
    try {
      setIsCreatingSnapshot(true);
      setOperationError(null);
      setOperationMessage(null);
      const response = await fetch("/api/admin/backups/snapshot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includeUploads: includeUploadsInExport }),
      });
      const data = (await response.json()) as { ok?: boolean; output?: { fileName?: string }; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "backup_snapshot_failed");
      }
      setOperationMessage(
        isRo
          ? `Snapshot creat: ${data.output?.fileName || "backup.zip"}`
          : `Snapshot created: ${data.output?.fileName || "backup.zip"}`
      );
    } catch {
      setOperationError(isRo ? "Snapshot backup esuat." : "Backup snapshot failed.");
    } finally {
      setIsCreatingSnapshot(false);
    }
  }

  async function rollbackSettingsVersion(versionId: string) {
    const confirmText = window.prompt(isRo ? "Scrie DELETE pentru confirmare:" : "Type DELETE to confirm:", "DELETE");
    if (!confirmText || confirmText.trim().toUpperCase() !== "DELETE") {
      return;
    }
    const adminPassword = window.prompt(isRo ? "Confirma parola ta de admin:" : "Confirm your admin password:");
    if (!adminPassword) {
      return;
    }

    try {
      setOperationError(null);
      setOperationMessage(null);
      const response = await fetch("/api/admin/settings/rollback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          versionId,
          confirmText: "DELETE",
          adminPassword,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "rollback_failed");
      }

      setOperationMessage(isRo ? "Rollback aplicat cu succes." : "Rollback applied successfully.");
      window.location.reload();
    } catch {
      setOperationError(isRo ? "Rollback esuat." : "Rollback failed.");
    }
  }

  const rangeLabel =
    adminDashboardDefaultRange === "7d"
      ? isRo
        ? "7 zile"
        : "7 days"
      : adminDashboardDefaultRange === "30d"
        ? isRo
          ? "30 zile"
          : "30 days"
        : isRo
          ? "90 zile"
          : "90 days";
  const postedLabel =
    jobsDefaultPostedFilter === "24h"
      ? isRo
        ? "Ultimele 24h"
        : "Last 24h"
      : jobsDefaultPostedFilter === "7d"
        ? isRo
          ? "Ultimele 7 zile"
          : "Last 7 days"
        : jobsDefaultPostedFilter === "30d"
          ? isRo
            ? "Ultimele 30 zile"
            : "Last 30 days"
          : isRo
            ? "Oricand"
            : "Any time";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        <TabButton active={activeTab === "identity"} onClick={() => changeTab("identity")}><Megaphone className="mr-1 inline size-3.5" />{isRo ? "Identitate" : "Identity"}</TabButton>
        <TabButton active={activeTab === "jobs"} onClick={() => changeTab("jobs")}><Settings2 className="mr-1 inline size-3.5" />{isRo ? "Reguli joburi" : "Jobs rules"}</TabButton>
        <TabButton active={activeTab === "security"} onClick={() => changeTab("security")}><ShieldCheck className="mr-1 inline size-3.5" />{isRo ? "Securitate" : "Security"}</TabButton>
        <TabButton active={activeTab === "seo"} onClick={() => changeTab("seo")}><Wrench className="mr-1 inline size-3.5" />SEO</TabButton>
        <TabButton active={activeTab === "integrations"} onClick={() => changeTab("integrations")}><Link2 className="mr-1 inline size-3.5" />{isRo ? "Integrari" : "Integrations"}</TabButton>
        <TabButton active={activeTab === "features"} onClick={() => changeTab("features")}>{isRo ? "Feature flags" : "Feature flags"}</TabButton>
        <TabButton active={activeTab === "retention"} onClick={() => changeTab("retention")}>{isRo ? "Retentie" : "Retention"}</TabButton>
        <TabButton active={activeTab === "operations"} onClick={() => changeTab("operations")}><Database className="mr-1 inline size-3.5" />{isRo ? "Operatiuni" : "Operations"}</TabButton>
      </div>

      <form action={updateAction} className="grid gap-3 md:grid-cols-2">
        <div className={activeTab === "identity" ? "contents" : "hidden"}>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Nume platforma" : "Platform name"}</span><p className="text-xs text-slate-500">{isRo ? "Apare in branding si titluri." : "Used in branding and titles."}</p><input name="siteName" defaultValue={settings.siteName} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Limba implicita site" : "Default site language"}</span><p className="text-xs text-slate-500">{isRo ? "Se aplica vizitatorilor noi fara preferinta salvata." : "Applied for new visitors without a saved preference."}</p><select name="defaultLocale" defaultValue={(settings as SiteSettings & { defaultLocale?: string }).defaultLocale || "ro"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="ro">Romana</option><option value="en">English</option></select></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Tagline" : "Tagline"}</span><p className="text-xs text-slate-500">{isRo ? "Mesaj scurt al platformei." : "Short platform message."}</p><input name="siteTagline" defaultValue={settings.siteTagline || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Email suport" : "Support email"}</span><p className="text-xs text-slate-500">{isRo ? "Pentru suport tehnic." : "For technical support."}</p><input name="supportEmail" defaultValue={settings.supportEmail || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Email contact" : "Contact email"}</span><p className="text-xs text-slate-500">{isRo ? "Pentru contact public." : "For public contact."}</p><input name="contactEmail" defaultValue={settings.contactEmail || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-600">{isRo ? "Telefon contact" : "Contact phone"}</span><p className="text-xs text-slate-500">{isRo ? "Numar de contact public." : "Public contact number."}</p><input name="contactPhone" defaultValue={settings.contactPhone || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>

        <div className={activeTab === "jobs" ? "contents" : "hidden"}>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Moneda implicita" : "Default currency"}</span><p className="text-xs text-slate-500">{isRo ? "Moneda preselectata la joburi." : "Preselected currency for jobs."}</p><select name="defaultCurrency" defaultValue={settings.defaultCurrency} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="EUR">Euro (EUR)</option><option value="USD">US Dollar (USD)</option><option value="RON">Romanian Leu (RON)</option></select></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Expirare implicita (zile)" : "Default expiration (days)"}</span><p className="text-xs text-slate-500">{isRo ? "Se aplica daca nu se selecteaza data." : "Used when no date is selected."}</p><input type="number" name="defaultJobExpirationDays" min={7} max={180} defaultValue={settings.defaultJobExpirationDays} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Joburi per pagina" : "Jobs per page"}</span><p className="text-xs text-slate-500">{isRo ? "Cate joburi se incarca in lista." : "How many jobs are loaded in list."}</p><input type="number" name="jobsPerPage" min={6} max={100} defaultValue={settings.jobsPerPage} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Interval implicit dashboard admin" : "Admin dashboard default range"}</span><p className="text-xs text-slate-500">{isRo ? "Filtrul implicit pentru statistici in dashboard." : "Default analytics filter in admin dashboard."}</p><select name="adminDashboardDefaultRange" value={adminDashboardDefaultRange} onChange={(event) => setAdminDashboardDefaultRange(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="7d">{isRo ? "7 zile" : "7 days"}</option><option value="30d">{isRo ? "30 zile" : "30 days"}</option><option value="90d">{isRo ? "90 zile" : "90 days"}</option></select></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Joburi recomandate pe homepage" : "Homepage featured jobs count"}</span><p className="text-xs text-slate-500">{isRo ? "Cate joburi apar in sectiunea principala de pe prima pagina." : "How many jobs appear in homepage featured sections."}</p><input type="number" name="homeFeaturedJobsCount" min={4} max={24} value={homeFeaturedJobsCount} onChange={(event) => setHomeFeaturedJobsCount(Math.min(24, Math.max(4, Number(event.target.value) || 8)))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Filtru implicit Posted (Jobs)" : "Default Posted filter (Jobs)"}</span><p className="text-xs text-slate-500">{isRo ? "Filtru aplicat implicit in pagina /jobs daca utilizatorul nu selecteaza altceva." : "Applied by default in /jobs when user does not choose another option."}</p><select name="jobsDefaultPostedFilter" value={jobsDefaultPostedFilter} onChange={(event) => setJobsDefaultPostedFilter(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="any">{isRo ? "Oricand" : "Any time"}</option><option value="24h">{isRo ? "Ultimele 24h" : "Last 24h"}</option><option value="7d">{isRo ? "Ultimele 7 zile" : "Last 7 days"}</option><option value="30d">{isRo ? "Ultimele 30 zile" : "Last 30 days"}</option></select></label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 md:col-span-2">
            <p className="font-semibold text-slate-900">{isRo ? "Preview live" : "Live preview"}</p>
            <p className="mt-1">
              {isRo
                ? `Dashboard Admin va porni pe ${rangeLabel}.`
                : `Admin Dashboard will start on ${rangeLabel}.`}
            </p>
            <p>
              {isRo
                ? `Homepage va afisa ${homeFeaturedJobsCount} joburi recomandate.`
                : `Homepage will show ${homeFeaturedJobsCount} featured jobs.`}
            </p>
            <p>
              {isRo
                ? `Pagina Jobs va porni cu filtrul Posted: ${postedLabel}.`
                : `Jobs page default Posted filter will be: ${postedLabel}.`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allowPublicRegistration" defaultChecked={settings.allowPublicRegistration} />{isRo ? "Permite inregistrare publica" : "Allow public registration"}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allowCandidatePosting" defaultChecked={settings.allowCandidatePosting} />{isRo ? "Permite postare joburi de utilizatori" : "Allow user job posting"}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="requireCompanyBeforePosting" defaultChecked={settings.requireCompanyBeforePosting} />{isRo ? "Companie obligatorie inainte de postare" : "Require company before posting"}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="autoApproveCandidateJobs" defaultChecked={settings.autoApproveCandidateJobs} />{isRo ? "Auto-approve joburi utilizatori" : "Auto-approve user jobs"}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="requireCvOnApply" defaultChecked={settings.requireCvOnApply} />{isRo ? "CV obligatoriu la aplicare" : "Require CV on apply"}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="preventDuplicateApplications" defaultChecked={settings.preventDuplicateApplications} />{isRo ? "Previne aplicari duplicate" : "Prevent duplicate applications"}</label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Mesaj minim aplicare" : "Min application message"}</span><p className="text-xs text-slate-500">{isRo ? "0 = optional." : "0 = optional."}</p><input type="number" name="minApplicationMessageLength" min={0} max={800} defaultValue={settings.minApplicationMessageLength} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Descriere minima job" : "Min job description"}</span><p className="text-xs text-slate-500">{isRo ? "Prag calitate anunt." : "Job quality threshold."}</p><input type="number" name="minJobDescriptionLength" min={20} max={4000} defaultValue={settings.minJobDescriptionLength} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-600">{isRo ? "Cuvinte blocate" : "Blocked keywords"}</span><p className="text-xs text-slate-500">{isRo ? "Separate prin virgula." : "Comma-separated."}</p><textarea name="blockedKeywords" rows={2} defaultValue={settings.blockedKeywords || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>

        <div className={activeTab === "security" ? "contents" : "hidden"}>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Login / h / IP</span><p className="text-xs text-slate-500">{isRo ? "Limita login pe IP." : "Login rate limit per IP."}</p><input type="number" name="loginRateLimitPerHour" min={1} max={500} defaultValue={settings.loginRateLimitPerHour} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Register / h / IP</span><p className="text-xs text-slate-500">{isRo ? "Limita register pe IP." : "Register rate limit per IP."}</p><input type="number" name="registerRateLimitPerHour" min={1} max={500} defaultValue={settings.registerRateLimitPerHour} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Apply / h / IP</span><p className="text-xs text-slate-500">{isRo ? "Limita apply pe IP." : "Apply rate limit per IP."}</p><input type="number" name="applyRateLimitPerHour" min={1} max={500} defaultValue={settings.applyRateLimitPerHour} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Sesiune admin (ore)" : "Admin session (hours)"}</span><p className="text-xs text-slate-500">{isRo ? "Durata maxima recomandata." : "Recommended max duration."}</p><input type="number" name="adminSessionMaxHours" min={1} max={168} defaultValue={settings.adminSessionMaxHours} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Max failed logins" : "Max failed logins"}</span><p className="text-xs text-slate-500">{isRo ? "Prag intern pentru alerte." : "Internal threshold for alerts."}</p><input type="number" name="maxFailedLogins" min={1} max={100} defaultValue={settings.maxFailedLogins} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="adminTwoFactorRequired" defaultChecked={settings.adminTwoFactorRequired} />{isRo ? "2FA obligatoriu pentru admin" : "Require 2FA for admin"}</label>
        </div>

        <div className={activeTab === "seo" ? "contents" : "hidden"}>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Google Analytics ID</span><p className="text-xs text-slate-500">G-XXXXXXXXXX</p><input name="gaMeasurementId" defaultValue={settings.gaMeasurementId || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Canonical URL</span><p className="text-xs text-slate-500">{isRo ? "URL principal indexat." : "Primary indexed URL."}</p><input name="seoCanonicalUrl" defaultValue={settings.seoCanonicalUrl || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-600">Default OG image URL</span><p className="text-xs text-slate-500">{isRo ? "Fallback pentru social share." : "Fallback for social share."}</p><input name="seoDefaultOgImage" defaultValue={settings.seoDefaultOgImage || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Favicon (din Media Library)" : "Favicon (from Media Library)"}</span><p className="text-xs text-slate-500">{isRo ? "Selecteaza un asset icon/image pentru favicon." : "Select an icon/image asset for favicon."}</p><select name="siteFaviconUrl" defaultValue={(settings as SiteSettings & { siteFaviconUrl?: string }).siteFaviconUrl || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">{isRo ? "Implicit" : "Default"}</option>{faviconOptions.map((item) => (<option key={item.url} value={item.url}>{item.label}</option>))}</select></label>
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-600">{isRo ? "Mesaj mentenanta" : "Maintenance message"}</span><p className="text-xs text-slate-500">{isRo ? "Apare cand maintenance mode este ON." : "Shown when maintenance mode is ON."}</p><textarea name="maintenanceMessage" rows={3} defaultValue={settings.maintenanceMessage || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="seoNoIndex" defaultChecked={settings.seoNoIndex} />{isRo ? "Noindex" : "Noindex"}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="maintenanceMode" defaultChecked={settings.maintenanceMode} />{isRo ? "Maintenance mode" : "Maintenance mode"}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enableSitemap" defaultChecked={settings.enableSitemap} />{isRo ? "Enable sitemap" : "Enable sitemap"}</label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Scope mentenanta" : "Maintenance scope"}</span><p className="text-xs text-slate-500">{isRo ? "Ce se blocheaza pentru non-admin." : "What is blocked for non-admin users."}</p><select name="maintenanceScope" defaultValue={settings.maintenanceScope} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="PUBLIC_ONLY">{isRo ? "Doar pagini publice" : "Public pages only"}</option><option value="ALL_NON_ADMIN">{isRo ? "Toate paginile non-admin" : "All non-admin pages"}</option></select></label>
        </div>

        <div className={activeTab === "integrations" ? "contents" : "hidden"}>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Webhook URL</span><p className="text-xs text-slate-500">{isRo ? "Endpoint extern pentru evenimente." : "External event endpoint."}</p><input name="webhookUrl" defaultValue={settings.webhookUrl || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Webhook secret</span><p className="text-xs text-slate-500">{isRo ? "Secret pentru validare webhook." : "Secret for webhook validation."}</p><input name="webhookSecret" defaultValue={settings.webhookSecret || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">SMTP host</span><p className="text-xs text-slate-500">{isRo ? "Server SMTP." : "SMTP server."}</p><input name="smtpHost" defaultValue={settings.smtpHost || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">SMTP port</span><p className="text-xs text-slate-500">{isRo ? "Port SMTP (587/465)." : "SMTP port (587/465)."}</p><input type="number" name="smtpPort" min={1} max={65535} defaultValue={settings.smtpPort || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">SMTP user</span><p className="text-xs text-slate-500">{isRo ? "Utilizator SMTP." : "SMTP username."}</p><input name="smtpUser" defaultValue={settings.smtpUser || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">SMTP password</span><p className="text-xs text-slate-500">{isRo ? "Parola/token SMTP." : "SMTP password/token."}</p><input name="smtpPassword" defaultValue={settings.smtpPassword || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">SMTP from</span><p className="text-xs text-slate-500">{isRo ? "Expeditor email automat." : "Automated email sender."}</p><input name="smtpFrom" defaultValue={settings.smtpFrom || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="smtpSecure" defaultChecked={settings.smtpSecure} />SMTP secure (TLS)</label>
        </div>

        <div className={activeTab === "features" ? "contents" : "hidden"}>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featureSavedJobs" defaultChecked={settings.featureSavedJobs} />Saved Jobs</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featureResumeBuilder" defaultChecked={settings.featureResumeBuilder} />Resume Builder</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featurePublicProfiles" defaultChecked={settings.featurePublicProfiles} />Public Profiles</label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Max upload (MB)" : "Max upload (MB)"}</span><p className="text-xs text-slate-500">{isRo ? "Limita dimensiune upload." : "Upload size limit."}</p><input type="number" name="maxUploadMb" min={1} max={200} defaultValue={settings.maxUploadMb} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Allowed MIME types" : "Allowed MIME types"}</span><p className="text-xs text-slate-500">{isRo ? "Lista MIME separate prin virgula." : "Comma-separated MIME list."}</p><input name="allowedMimeTypes" defaultValue={settings.allowedMimeTypes || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Timezone implicita" : "Default timezone"}</span><p className="text-xs text-slate-500">{isRo ? "Timezone pentru taskuri interne." : "Timezone for internal tasks."}</p><input name="defaultTimezone" defaultValue={settings.defaultTimezone} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Format data" : "Date format"}</span><p className="text-xs text-slate-500">{isRo ? "Format recomandat in UI." : "Preferred date format in UI."}</p><input name="dateFormat" defaultValue={settings.dateFormat} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-600">{isRo ? "Tari permise" : "Allowed countries"}</span><p className="text-xs text-slate-500">{isRo ? "Separate prin virgula, ex: RO,US,DE." : "Comma-separated, e.g. RO,US,DE."}</p><input name="allowedCountries" defaultValue={settings.allowedCountries || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>

        <div className={activeTab === "retention" ? "contents" : "hidden"}>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="autoCloseExpiredJobs" defaultChecked={settings.autoCloseExpiredJobs} />{isRo ? "Auto-inchide joburile expirate" : "Auto-close expired jobs"}</label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Retentie aplicari (zile)" : "Application retention (days)"}</span><p className="text-xs text-slate-500">{isRo ? "Aplicatii mai vechi sunt sterse." : "Older applications are deleted."}</p><input type="number" name="applicationRetentionDays" min={7} max={3650} defaultValue={settings.applicationRetentionDays} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-600">{isRo ? "Retentie drafturi (zile)" : "Draft retention (days)"}</span><p className="text-xs text-slate-500">{isRo ? "Drafturi vechi sunt sterse." : "Older drafts are deleted."}</p><input type="number" name="draftRetentionDays" min={7} max={3650} defaultValue={settings.draftRetentionDays} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>

        <div className={activeTab === "operations" ? "contents" : "hidden"}>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">{isRo ? "Export backup" : "Backup export"}</p>
            <p className="mt-1 text-xs text-slate-600">
              {isRo
                ? "Descarca o arhiva .zip cu baza de date curenta si optional fisierele uploadate."
                : "Download a .zip archive with the current database and optionally uploaded files."}
            </p>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeUploadsInExport}
                onChange={(event) => setIncludeUploadsInExport(event.target.checked)}
              />
              {isRo ? "Include fisierele uploadate (public/uploads)" : "Include uploaded files (public/uploads)"}
            </label>
            <a
              href={`/api/admin/backups/export?includeUploads=${includeUploadsInExport ? "1" : "0"}`}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <Upload className="size-4" />
              {isRo ? "Descarca backup" : "Download backup"}
            </a>
            <button
              type="button"
              onClick={createBackupSnapshot}
              disabled={isCreatingSnapshot}
              className="mt-3 ml-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Database className="size-4" />
              {isCreatingSnapshot
                ? isRo
                  ? "Creez snapshot..."
                  : "Creating snapshot..."
                : isRo
                  ? "Creeaza snapshot pe server"
                  : "Create server snapshot"}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">{isRo ? "Import backup" : "Backup import"}</p>
            <p className="mt-1 text-xs text-slate-600">
              {isRo
                ? "Incarca arhiva backup (.zip). Baza de date va fi inlocuita cu varianta din arhiva."
                : "Upload a backup archive (.zip). The database will be replaced with archive data."}
            </p>
            <input
              name="backupFile"
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => setBackupImportFile(event.target.files?.[0] || null)}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={replaceUploadsOnImport}
                onChange={(event) => setReplaceUploadsOnImport(event.target.checked)}
              />
              {isRo ? "Inlocuieste si fisierele uploadate din arhiva" : "Also replace uploaded files from archive"}
            </label>
            <button
              type="button"
              disabled={isImportingBackup}
              onClick={handleImportBackup}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Database className="size-4" />
              {isImportingBackup
                ? isRo
                  ? "Import in curs..."
                  : "Importing..."
                : isRo
                  ? "Importa backup"
                  : "Import backup"}
            </button>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">{isRo ? "Smoke tests (Playwright)" : "Smoke tests (Playwright)"}</p>
            <p className="mt-1 text-xs text-slate-600">
              {isRo
                ? "Ruleaza suita smoke configurata in proiect (home/jobs/login) direct din panoul admin."
                : "Run the project smoke suite (home/jobs/login) directly from admin panel."}
            </p>
            <button
              type="button"
              disabled={isRunningSmoke}
              onClick={runSmokeTests}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FlaskConical className="size-4" />
              {isRunningSmoke
                ? isRo
                  ? "Rulez smoke..."
                  : "Running smoke..."
                : isRo
                  ? "Ruleaza smoke tests"
                  : "Run smoke tests"}
            </button>
            {smokeOutput ? (
              <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                {smokeOutput}
              </pre>
            ) : null}
          </div>

          {operationMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 md:col-span-2">
              {operationMessage}
            </div>
          ) : null}
          {operationError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 md:col-span-2">
              {operationError}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">{isRo ? "Task queue recenta" : "Recent task queue"}</p>
            <div className="mt-3 space-y-2">
              {recentTasks.map((task) => {
                const output = parseTaskOutput(task.outputJson);
                return (
                  <div key={task.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                    <p className="font-semibold text-slate-900">{task.type}</p>
                    <p className="mt-1 text-slate-600">
                      {task.status} - {task.createdAt.toLocaleString(isRo ? "ro-RO" : "en-GB")}
                    </p>
                    {output?.downloadPath ? (
                      <a href={String(output.downloadPath)} className="mt-1 inline-block text-cyan-700 underline underline-offset-2">
                        {isRo ? "Descarca snapshot" : "Download snapshot"}
                      </a>
                    ) : null}
                    {task.errorText ? <p className="mt-1 text-rose-700">{task.errorText}</p> : null}
                  </div>
                );
              })}
              {recentTasks.length === 0 ? (
                <p className="text-sm text-slate-600">{isRo ? "Nu exista task-uri." : "No tasks yet."}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">{isRo ? "Versiuni setari (rollback)" : "Settings versions (rollback)"}</p>
            <div className="mt-3 space-y-2">
              {settingsVersions.map((version) => (
                <div key={version.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                  <p className="font-medium text-slate-900">{version.reason || "snapshot"}</p>
                  <p className="mt-1 text-slate-600">
                    {version.createdAt.toLocaleString(isRo ? "ro-RO" : "en-GB")} - {version.createdBy?.name || version.createdBy?.email || "system"}
                  </p>
                  <button
                    type="button"
                    onClick={() => rollbackSettingsVersion(version.id)}
                    className="mt-2 rounded-md border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                  >
                    {isRo ? "Rollback la aceasta versiune" : "Rollback to this version"}
                  </button>
                </div>
              ))}
              {settingsVersions.length === 0 ? (
                <p className="text-sm text-slate-600">{isRo ? "Nu exista versiuni salvate." : "No saved versions yet."}</p>
              ) : null}
            </div>
          </div>
        </div>

        {activeTab !== "operations" ? (
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2">
            {saveLabel}
          </button>
        ) : null}
      </form>

      {activeTab === "integrations" ? (
        <form action={smtpTestAction} className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">{isRo ? "Test SMTP" : "SMTP test"}</p>
          <p className="mt-1 text-xs text-slate-600">
            {isRo
              ? "Trimite un email de proba pentru a verifica setarile SMTP curente."
              : "Send a test email to validate your current SMTP settings."}
          </p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <input
              type="email"
              name="email"
              required
              value={smtpTestEmail}
              onChange={(event) => setSmtpTestEmail(event.target.value)}
              placeholder={isRo ? "email@exemplu.ro" : "email@example.com"}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              {isRo ? "Trimite test" : "Send test"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
