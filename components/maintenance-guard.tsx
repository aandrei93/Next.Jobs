"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MaintenanceGuardProps = {
  enabled: boolean;
  scope: "PUBLIC_ONLY" | "ALL_NON_ADMIN";
  isAdminUser: boolean;
  locale: "ro" | "en";
  message: string | null;
  supportEmail: string | null;
  children: React.ReactNode;
};

export function MaintenanceGuard({ enabled, scope, isAdminUser, locale, message, supportEmail, children }: MaintenanceGuardProps) {
  const pathname = usePathname() || "/";
  const isBypassPath = pathname.startsWith("/admin") || pathname.startsWith("/login");
  const isWorkspacePath = pathname.startsWith("/me") || pathname.startsWith("/saved-jobs");
  const blocksPath =
    scope === "ALL_NON_ADMIN"
      ? true
      : !isWorkspacePath;
  const showMaintenance = enabled && !isAdminUser && !isBypassPath && blocksPath;

  if (!showMaintenance) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">{locale === "ro" ? "Mentenanta" : "Maintenance"}</p>
        <h1 className="mt-3 font-[var(--font-sora)] text-3xl font-semibold">{locale === "ro" ? "Revenim in curand" : "We will be back shortly"}</h1>
        <p className="mt-3 text-sm text-slate-300">
          {message ||
            (locale === "ro"
              ? "Efectuam imbunatatiri planificate. Te rugam sa revii in cateva minute."
              : "We are performing scheduled improvements. Please check back in a few minutes.")}
        </p>
        {supportEmail ? (
          <p className="mt-4 text-sm text-slate-300">
            {locale === "ro" ? "Suport:" : "Support:"}{" "}
            <a className="underline underline-offset-2" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </p>
        ) : null}
        <div className="mt-5">
          <Link href="/login" className="inline-flex rounded-full border border-slate-500 px-4 py-2 text-sm font-medium hover:bg-slate-800">
            {locale === "ro" ? "Login administrator" : "Administrator login"}
          </Link>
        </div>
      </div>
    </main>
  );
}
