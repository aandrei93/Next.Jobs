import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Workspace" };

export default async function WorkspaceOverviewPage() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  redirect(session.user.accountType === "employer" ? "/me/employer" : "/me/candidate");
}
