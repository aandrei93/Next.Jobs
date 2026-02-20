import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function EmployerWorkspaceOverviewPage() {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);

  if (!session) {
    return null;
  }

  if (session.user.accountType !== "employer") {
    redirect("/me/access-denied?required=employer");
  }

  const dict = await getDictionary(locale);

  const [postedJobs, savedJobs, ownedCompanies, receivedApplications] = await Promise.all([
    prisma.job.count({ where: { createdById: session.user.id } }),
    prisma.savedJob.count({ where: { userId: session.user.id } }),
    prisma.company.count({ where: { ownerId: session.user.id } }),
    prisma.application.count({ where: { job: { createdById: session.user.id } } }),
  ]);

  const cards = [
    {
      href: "/me/employer/companies",
      title: dict.me.companies,
      value: String(ownedCompanies),
      helper: locale === "ro" ? "Companii administrate" : "Managed companies",
    },
    {
      href: "/me/employer/jobs",
      title: dict.me.myJobs,
      value: String(postedJobs),
      helper: dict.me.myPostedJobs,
    },
    {
      href: "/me/employer/applications",
      title: locale === "ro" ? "Aplicatii primite" : "Received applications",
      value: String(receivedApplications),
      helper: locale === "ro" ? "La joburile tale" : "For your jobs",
    },
    {
      href: "/me/employer/profile",
      title: dict.me.profile,
      value: String(savedJobs),
      helper: dict.me.statsSavedJobs,
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold">{dict.me.dashboard}</h1>
      <p className="mt-1 text-sm text-slate-600">{dict.me.subtitle}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

