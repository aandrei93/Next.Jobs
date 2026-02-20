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
    "allowCandidatePosting" BOOLEAN NOT NULL DEFAULT true,
    "allowPublicRegistration" BOOLEAN NOT NULL DEFAULT true,
    "requireCompanyBeforePosting" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveCandidateJobs" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "seoNoIndex" BOOLEAN NOT NULL DEFAULT false,
    "gaMeasurementId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("allowCandidatePosting", "createdAt", "id", "jobsPerPage", "requireCompanyBeforePosting", "siteName", "supportEmail", "updatedAt") SELECT "allowCandidatePosting", "createdAt", "id", "jobsPerPage", "requireCompanyBeforePosting", "siteName", "supportEmail", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
