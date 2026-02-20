-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferredLocale" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "htmlBody" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EmailTemplate" ("createdAt", "htmlBody", "id", "isEnabled", "key", "subject", "textBody", "updatedAt") SELECT "createdAt", "htmlBody", "id", "isEnabled", "key", "subject", "textBody", "updatedAt" FROM "EmailTemplate";
DROP TABLE "EmailTemplate";
ALTER TABLE "new_EmailTemplate" RENAME TO "EmailTemplate";
CREATE INDEX "EmailTemplate_locale_idx" ON "EmailTemplate"("locale");
CREATE UNIQUE INDEX "EmailTemplate_key_locale_key" ON "EmailTemplate"("key", "locale");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
