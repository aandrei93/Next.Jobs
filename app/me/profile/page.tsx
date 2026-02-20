import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Profile" };

export default async function WorkspaceProfileLegacyRedirectPage() {
  redirect("/me");
}
