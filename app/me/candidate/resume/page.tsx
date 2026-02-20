import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth";
import { ResumeBuilder } from "@/components/resume-builder";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { updateMyResume } from "@/lib/user-actions";
export const metadata: Metadata = { title: "My resume" };

export default async function WorkspaceResumePage() {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);
  const dict = await getDictionary(locale);

  if (!session) {
    return null;
  }

  const [resume, user, settings] = await Promise.all([
    prisma.resume.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { city: true, citizenship: true, birthDate: true, gender: true },
    }),
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
  ]);

  if (!settings.featureResumeBuilder) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{dict.me.resume}</h1>
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {locale === "ro" ? "Resume builder este dezactivat de administrator." : "Resume builder is disabled by administrator."}
        </section>
      </div>
    );
  }

  return (
    <ResumeBuilder
      locale={locale}
      resume={resume}
      profile={{
        city: user?.city || null,
        citizenship: user?.citizenship || null,
        birthDate: user?.birthDate
          ? user.birthDate.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : null,
        gender: user?.gender || null,
      }}
      updateAction={updateMyResume}
      labels={{
        title: dict.me.resume,
        quickApply: dict.me.quickApply,
        headline: dict.me.headline,
        desiredRole: dict.me.desiredRole,
        preferredCity: dict.me.preferredCity,
        summary: dict.me.summary,
        skills: dict.me.skills,
        experience: dict.me.experience,
        education: dict.me.education,
        links: dict.me.links,
        updateResume: dict.me.updateResume,
        resumePreview: dict.me.resumePreview,
      }}
    />
  );
}

