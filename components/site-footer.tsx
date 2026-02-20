import Image from "next/image";
import Link from "next/link";
import { ProtectedEmailLink } from "@/components/protected-email-link";
import { getCurrentSession } from "@/lib/auth";
import { FRONTEND_VERSION } from "@/lib/frontend-changelog";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";

function encodeEmail(value: string) {
  return value
    .split("")
    .map((char) => String(char.charCodeAt(0) + 7))
    .join(".");
}

export async function SiteFooter() {
  const [locale, settings, session] = await Promise.all([
    getLocale(),
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    getCurrentSession(),
  ]);
  const dict = await getDictionary(locale);
  const year = new Date().getFullYear();

  return (
    <footer data-site-footer className="mt-10 border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="grid w-full gap-8 px-[var(--layout-gutter)] py-10 md:grid-cols-3">
        <div>
          <div className="inline-flex items-center rounded-lg bg-white px-2.5 py-1.5">
            <Image src="/brand/nextjobs-logo.svg" alt="nextjobs" width={148} height={36} className="h-7 w-auto" />
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {settings.siteTagline ||
              (locale === "ro"
                ? "Platforma completa pentru listari joburi, aplicari si administrare."
                : "Complete jobs listing platform with applications and admin control.")}
          </p>
          {(settings.contactEmail || settings.contactPhone) && (
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              {settings.contactEmail ? (
                <p>
                  Email:{" "}
                  <ProtectedEmailLink
                    encodedEmail={encodeEmail(settings.contactEmail)}
                    revealLabel={dict.common.revealEmail}
                  />
                </p>
              ) : null}
              {settings.contactPhone ? <p>{settings.contactPhone}</p> : null}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {locale === "ro" ? "Navigare" : "Navigate"}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/jobs" className="hover:text-white">{dict.nav.findJobs}</Link>
            {settings.featureSavedJobs ? <Link href="/saved-jobs" className="hover:text-white">{dict.nav.savedJobs}</Link> : null}
            <Link href="/me" className="hover:text-white">{dict.nav.workspace}</Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {locale === "ro" ? "Cont" : "Account"}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {!session ? <Link href="/login" className="hover:text-white">{dict.nav.login}</Link> : null}
            {!session ? <Link href="/register" className="hover:text-white">{dict.nav.join}</Link> : null}
            {session ? <Link href="/me" className="hover:text-white">{dict.nav.workspace}</Link> : null}
            <Link href="/privacy" className="hover:text-white">{locale === "ro" ? "Politica de confidentialitate" : "Privacy policy"}</Link>
            <Link href="/changelog" className="hover:text-white">Release Note</Link>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-[var(--layout-gutter)] py-4 text-xs text-slate-400">
        <p>(c) {year} {settings.siteName || "nextjobs"}</p>
        <p>Versiune: {FRONTEND_VERSION}</p>
      </div>
    </footer>
  );
}
