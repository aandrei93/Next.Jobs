import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
export const metadata: Metadata = { title: "My resume" };

export default async function WorkspaceResumePage() {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);

  if (!session) {
    return null;
  }

  redirect(`/me/employer/profile?security=${encodeURIComponent(locale === "ro" ? "cv_not_available_for_employer" : "resume_not_available_for_employer")}`);
}

