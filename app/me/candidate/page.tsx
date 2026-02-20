import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function CandidateWorkspaceOverviewPage() {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);

  if (!session) {
    return null;
  }

  if (session.user.accountType !== "candidate") {
    redirect("/me/access-denied?required=candidate");
  }

  const dict = await getDictionary(locale);

  const [resume, myApplications, savedJobs] = await Promise.all([
    prisma.resume.findUnique({ where: { userId: session.user.id }, select: { id: true, updatedAt: true } }),
    prisma.application.count({ where: { userId: session.user.id } }),
    prisma.savedJob.count({ where: { userId: session.user.id } }),
  ]);

  const cards = [
    {
      href: "/me/candidate/profile",
      title: dict.me.profile,
      value: String(savedJobs),
      helper: dict.me.statsSavedJobs,
    },
    {
      href: "/me/candidate/resume",
      title: dict.me.resume,
      value: resume ? "1" : "0",
      helper: resume ? new Date(resume.updatedAt).toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB") : "-",
    },
    {
      href: "/me/candidate/applications",
      title: dict.me.myApplications,
      value: String(myApplications),
      helper: dict.me.submittedOn,
    },
    {
      href: "/saved-jobs",
      title: dict.nav.savedJobs,
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

