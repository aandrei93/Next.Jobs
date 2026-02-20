import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { getCurrentSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "My Space",
    template: "%s | My Space",
  },
};

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?callbackUrl=/me");
  }

  return (
    <main className="w-full px-[var(--layout-gutter)] py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <WorkspaceSidebar />
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
