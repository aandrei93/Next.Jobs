import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "My companies" };

export default async function WorkspaceCompaniesLegacyRedirectPage() {
  redirect("/me/employer/companies");
}
