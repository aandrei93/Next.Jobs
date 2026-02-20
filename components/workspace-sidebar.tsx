import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getCurrentSession } from "@/lib/auth";
import { WorkspaceSidebarClient } from "@/components/workspace-sidebar-client";

export async function WorkspaceSidebar() {
  const [locale, settings, session] = await Promise.all([
    getLocale(),
    prisma.siteSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} }),
    getCurrentSession(),
  ]);
  const dict = await getDictionary(locale);
  const isEmployer = session?.user.accountType === "employer";
  const base = isEmployer ? "/me/employer" : "/me/candidate";

  const links = [
    { href: base, label: dict.admin.overview, icon: "overview" as const },
    { href: `${base}/profile`, label: dict.me.profile, icon: "profile" as const },
    ...(!isEmployer && settings.featureResumeBuilder ? [{ href: `${base}/resume`, label: dict.me.resume, icon: "resume" as const }] : []),
    ...(isEmployer ? [{ href: `${base}/companies`, label: dict.me.companies, icon: "companies" as const }] : []),
    ...(isEmployer ? [{ href: `${base}/jobs`, label: dict.me.myJobs, icon: "jobs" as const }] : []),
    { href: `${base}/applications`, label: isEmployer ? (locale === "ro" ? "Aplicatii primite" : "Received applications") : dict.me.myApplications, icon: "applications" as const },
  ];

  return <WorkspaceSidebarClient title={dict.nav.workspace} links={links} />;
}
