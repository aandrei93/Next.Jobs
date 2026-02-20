-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT true,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "bio" TEXT,
    "city" TEXT,
    "citizenship" TEXT,
    "birthDate" DATETIME,
    "gender" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "accountType" TEXT NOT NULL DEFAULT 'candidate',
    "preferredLocale" TEXT,
    "notifyNewApplicationEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyDigestEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("bio", "birthDate", "citizenship", "city", "createdAt", "email", "emailVerified", "gender", "github", "id", "linkedin", "name", "notifyDigestEmail", "notifyNewApplicationEmail", "passwordHash", "preferredLocale", "role", "sessionVersion", "title", "updatedAt", "website") SELECT "bio", "birthDate", "citizenship", "city", "createdAt", "email", "emailVerified", "gender", "github", "id", "linkedin", "name", "notifyDigestEmail", "notifyNewApplicationEmail", "passwordHash", "preferredLocale", "role", "sessionVersion", "title", "updatedAt", "website" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
