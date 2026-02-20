-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'nextjobs',
    "siteTagline" TEXT DEFAULT 'Find your next opportunity faster.',
    "supportEmail" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "defaultJobExpirationDays" INTEGER NOT NULL DEFAULT 30,
    "jobsPerPage" INTEGER NOT NULL DEFAULT 20,
    "maintenanceScope" TEXT NOT NULL DEFAULT 'PUBLIC_ONLY',
    "loginRateLimitPerHour" INTEGER NOT NULL DEFAULT 20,
    "registerRateLimitPerHour" INTEGER NOT NULL DEFAULT 10,
    "applyRateLimitPerHour" INTEGER NOT NULL DEFAULT 25,
    "requireCvOnApply" BOOLEAN NOT NULL DEFAULT false,
    "minApplicationMessageLength" INTEGER NOT NULL DEFAULT 0,
    "preventDuplicateApplications" BOOLEAN NOT NULL DEFAULT true,
    "blockedKeywords" TEXT,
    "minJobDescriptionLength" INTEGER NOT NULL DEFAULT 20,
    "allowCandidatePosting" BOOLEAN NOT NULL DEFAULT true,
    "allowPublicRegistration" BOOLEAN NOT NULL DEFAULT true,
    "requireCompanyBeforePosting" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveCandidateJobs" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "seoNoIndex" BOOLEAN NOT NULL DEFAULT false,
    "seoCanonicalUrl" TEXT,
    "seoDefaultOgImage" TEXT,
    "enableSitemap" BOOLEAN NOT NULL DEFAULT true,
    "gaMeasurementId" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpFrom" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "adminSessionMaxHours" INTEGER NOT NULL DEFAULT 12,
    "maxFailedLogins" INTEGER NOT NULL DEFAULT 10,
    "adminTwoFactorRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxUploadMb" INTEGER NOT NULL DEFAULT 10,
    "allowedMimeTypes" TEXT,
    "defaultTimezone" TEXT NOT NULL DEFAULT 'Europe/Bucharest',
    "dateFormat" TEXT NOT NULL DEFAULT 'dd.MM.yyyy',
    "allowedCountries" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "featureSavedJobs" BOOLEAN NOT NULL DEFAULT true,
    "featureResumeBuilder" BOOLEAN NOT NULL DEFAULT true,
    "featurePublicProfiles" BOOLEAN NOT NULL DEFAULT false,
    "autoCloseExpiredJobs" BOOLEAN NOT NULL DEFAULT true,
    "applicationRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "draftRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("allowCandidatePosting", "allowPublicRegistration", "autoApproveCandidateJobs", "contactEmail", "contactPhone", "createdAt", "defaultCurrency", "defaultJobExpirationDays", "gaMeasurementId", "id", "jobsPerPage", "maintenanceMessage", "maintenanceMode", "requireCompanyBeforePosting", "seoNoIndex", "siteName", "siteTagline", "supportEmail", "updatedAt") SELECT "allowCandidatePosting", "allowPublicRegistration", "autoApproveCandidateJobs", "contactEmail", "contactPhone", "createdAt", "defaultCurrency", "defaultJobExpirationDays", "gaMeasurementId", "id", "jobsPerPage", "maintenanceMessage", "maintenanceMode", "requireCompanyBeforePosting", "seoNoIndex", "siteName", "siteTagline", "supportEmail", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RateLimitEvent_action_ip_createdAt_idx" ON "RateLimitEvent"("action", "ip", "createdAt");
