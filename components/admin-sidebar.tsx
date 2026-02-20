import { getDictionary, getLocale } from "@/lib/i18n";
import { AdminSidebarClient } from "@/components/admin-sidebar-client";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";

export async function AdminSidebar() {
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);
  const staleReviewThreshold = new Date();
  staleReviewThreshold.setHours(staleReviewThreshold.getHours() - 48);

  const [locale, pendingCompaniesForApproval, pendingCategorySuggestions, pendingJobsForReview, errors24h, staleReviews] = await Promise.all([
    getLocale(),
    prisma.company.count({
      where: { verificationStatus: "PENDING_VERIFICATION" },
    }),
    prisma.categorySuggestion.count({
      where: { status: "PENDING" },
    }),
    prisma.job.count({
      where: { status: "PENDING_REVIEW" },
    }),
    prisma.errorLog.count({
      where: { createdAt: { gte: last24h } },
    }),
    prisma.job.count({
      where: {
        status: "PENDING_REVIEW",
        createdAt: { lt: staleReviewThreshold },
      },
    }),
  ]);
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const pendingBadge = pendingCompaniesForApproval > 0 ? formatCompactMetric(pendingCompaniesForApproval, locale) : undefined;
  const pendingCategoryBadge = pendingCategorySuggestions > 0 ? formatCompactMetric(pendingCategorySuggestions, locale) : undefined;
  const pendingJobsBadge = pendingJobsForReview > 0 ? formatCompactMetric(pendingJobsForReview, locale) : undefined;
  const errorsBadge = errors24h > 0 ? formatCompactMetric(errors24h, locale) : undefined;
  const alertsBadge = staleReviews > 0 ? formatCompactMetric(staleReviews, locale) : undefined;

  const groups = [
    {
      title: locale === "ro" ? "Panou" : "Dashboard",
      links: [{ href: "/admin", label: dict.admin.overview, icon: "overview" as const }],
    },
    {
      title: locale === "ro" ? "Marketplace" : "Marketplace",
      links: [
        { href: "/admin/jobs", label: dict.admin.jobs, badge: pendingJobsBadge, icon: "jobs" as const },
        { href: "/admin/companies", label: dict.admin.companies, badge: pendingBadge, icon: "companies" as const },
        { href: "/admin/categories", label: dict.admin.categories, badge: pendingCategoryBadge, icon: "categories" as const },
      ],
    },
    {
      title: locale === "ro" ? "Acces general" : "General access",
      links: [
        { href: "/admin/users", label: locale === "ro" ? "Toti utilizatorii" : "All users", icon: "users" as const },
        { href: "/admin/applications", label: locale === "ro" ? "Toate aplicatiile" : "All applications", icon: "applications" as const },
        { href: "/admin/jobs?status=PENDING_REVIEW", label: locale === "ro" ? "Alerte review" : "Review alerts", badge: alertsBadge, icon: "alerts" as const },
      ],
    },
    {
      title: locale === "ro" ? "Zone dedicate Candidat" : "Candidate dedicated",
      links: [
        { href: "/admin/users?accountType=candidate", label: locale === "ro" ? "Utilizatori candidati" : "Candidate users", icon: "candidate" as const },
        { href: "/admin/applications?scope=candidate", label: locale === "ro" ? "Aplicari candidati" : "Candidate applications", icon: "candidate" as const },
      ],
    },
    {
      title: locale === "ro" ? "Zone dedicate Angajator" : "Employer dedicated",
      links: [
        { href: "/admin/users?accountType=employer", label: locale === "ro" ? "Utilizatori angajatori" : "Employer users", icon: "employer" as const },
        { href: "/admin/companies", label: locale === "ro" ? "Companii angajatori" : "Employer companies", icon: "employer" as const },
        { href: "/admin/jobs?ownerType=employer", label: locale === "ro" ? "Joburi angajatori" : "Employer jobs", icon: "employer" as const },
        { href: "/admin/applications?scope=employer", label: locale === "ro" ? "Inbox angajatori" : "Employer inbox", icon: "employer" as const },
      ],
    },
    {
      title: locale === "ro" ? "Configurare" : "Configuration",
      links: [
        { href: "/admin/settings", label: dict.admin.settings, icon: "settings" as const },
        { href: "/admin/errors", label: locale === "ro" ? "Jurnal erori" : "Error logs", badge: errorsBadge, icon: "errors" as const },
        { href: "/admin/audit", label: locale === "ro" ? "Audit schimbari" : "Change audit", icon: "audit" as const },
        { href: "/admin/trash", label: locale === "ro" ? "Cos de gunoi" : "Trash", icon: "trash" as const },
        { href: "/admin/release-notes", label: locale === "ro" ? "Release Notes Admin" : "Admin Release Notes", icon: "releaseNotes" as const },
      ],
    },
  ];

  return (
    <AdminSidebarClient
      groups={groups}
      platformSettingsLabel={isRo ? "Setari platforma" : "Platform settings"}
      translationsLabel={isRo ? "Traduceri" : "Translations"}
      emailTemplatesLabel={isRo ? "Template-uri Email" : "Email templates"}
      mediaLibraryLabel={isRo ? "Media Library" : "Media library"}
    />
  );
}
