import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs";
import { AdminSidebar } from "@/components/admin-sidebar";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <main className="w-full px-[var(--layout-gutter)] py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <AdminSidebar />
        <section className="min-w-0 flex-1 space-y-3">
          <AdminBreadcrumbs locale={locale} />
          {children}
        </section>
      </div>
    </main>
  );
}
