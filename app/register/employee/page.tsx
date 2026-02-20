import type { Metadata } from "next";
import { RegisterScreen } from "@/components/register-screen";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "ro" ? "Inregistrare candidat" : "Candidate registration",
  };
}

export default async function EmployeeRegisterPage() {
  const locale = await getLocale();
  return <RegisterScreen locale={locale} type="candidate" />;
}
