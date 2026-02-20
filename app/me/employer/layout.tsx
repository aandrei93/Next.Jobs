import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  if (session.user.accountType !== "employer") {
    redirect("/me/access-denied?required=employer");
  }

  return <>{children}</>;
}

