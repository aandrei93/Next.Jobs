import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "My jobs" };

export default async function WorkspaceJobsLegacyRedirectPage() {
  redirect("/me/employer/jobs");
}
