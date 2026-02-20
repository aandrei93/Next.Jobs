import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Resume" };

export default async function WorkspaceResumeLegacyRedirectPage() {
  redirect("/me");
}
