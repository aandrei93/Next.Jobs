import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  if (session.user.accountType !== "candidate") {
    redirect("/me/access-denied?required=candidate");
  }

  return <>{children}</>;
}

