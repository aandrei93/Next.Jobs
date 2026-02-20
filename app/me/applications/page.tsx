import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "My applications" };

export default async function WorkspaceApplicationsLegacyRedirectPage() {
  redirect("/me");
}
