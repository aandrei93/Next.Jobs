import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { FlashToast } from "@/components/flash-toast";
import { MaintenanceGuard } from "@/components/maintenance-guard";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";
import { ScrollTopFab } from "@/components/scroll-top-fab";
import { ClientErrorMonitor } from "@/components/client-error-monitor";
import { GlobalScrollReveal } from "@/components/global-scroll-reveal";
import { PrivacyConsent } from "@/components/privacy-consent";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const title = settings.siteName || "NextJobs";
  const description = settings.siteTagline || "Jobs marketplace with full admin control";
  const ogImage = settings.seoDefaultOgImage || "/opengraph-image";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    openGraph: {
      title,
      description,
      images: [ogImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: settings.seoCanonicalUrl ? { canonical: settings.seoCanonicalUrl } : undefined,
    robots: settings.seoNoIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
    icons: {
      icon: settings.siteFaviconUrl || "/brand/nextjobs-logo.svg",
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
  const isAdminUser = session?.user.role === "ADMIN";

  return (
    <html lang={locale}>
      <body className={`${manrope.variable} ${sora.variable} font-[var(--font-manrope)]`}>
        {settings.gaMeasurementId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaMeasurementId}`} strategy="afterInteractive" />
            <Script id="ga-tracking" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${settings.gaMeasurementId}');`}
            </Script>
          </>
        ) : null}

        <MaintenanceGuard
          enabled={settings.maintenanceMode}
          scope={settings.maintenanceScope}
          isAdminUser={isAdminUser}
          locale={locale}
          message={settings.maintenanceMessage}
          supportEmail={settings.supportEmail}
        >
          <>
            <SiteHeader />
            <SiteBreadcrumbs locale={locale} />
            {children}
            <SiteFooter />
            <ScrollTopFab />
          </>
        </MaintenanceGuard>

        <FlashToast
          messages={{
            saved: dict.toast.saved,
            unsaved: dict.toast.unsaved,
            applied: dict.toast.applied,
            applyError: dict.toast.applyError,
            adminSuccess: dict.toast.adminSuccess,
            adminError: dict.toast.adminError,
            resumeSaved: dict.toast.resumeSaved,
            successTitle: dict.toast.successTitle,
            errorTitle: dict.toast.errorTitle,
            closeLabel: dict.toast.closeLabel,
          }}
        />
        <ClientErrorMonitor />
        <GlobalScrollReveal />
        <PrivacyConsent locale={locale} />
      </body>
    </html>
  );
}
