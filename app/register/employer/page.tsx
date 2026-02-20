import type { Metadata } from "next";
import { RegisterScreen } from "@/components/register-screen";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "ro" ? "Inregistrare angajator" : "Employer registration",
  };
}

export default async function EmployerRegisterPage() {
  const locale = await getLocale();
  return <RegisterScreen locale={locale} type="employer" />;
}
