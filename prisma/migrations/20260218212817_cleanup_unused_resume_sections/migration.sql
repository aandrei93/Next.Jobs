/*
  Warnings:

  - You are about to drop the column `achievements` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `certifications` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `projects` on the `Resume` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "skills" TEXT,
    "languages" TEXT,
    "experience" TEXT,
    "experienceYears" TEXT,
    "education" TEXT,
    "links" TEXT,
    "desiredRole" TEXT,
    "preferredCity" TEXT,
    "phone" TEXT,
    "availability" TEXT,
    "workPreference" TEXT,
    "workAuthorization" TEXT,
    "drivingLicense" TEXT,
    "hobbies" TEXT,
    "expectedSalary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Resume" ("availability", "createdAt", "desiredRole", "drivingLicense", "education", "expectedSalary", "experience", "experienceYears", "headline", "hobbies", "id", "languages", "links", "phone", "preferredCity", "skills", "summary", "updatedAt", "userId", "workAuthorization", "workPreference") SELECT "availability", "createdAt", "desiredRole", "drivingLicense", "education", "expectedSalary", "experience", "experienceYears", "headline", "hobbies", "id", "languages", "links", "phone", "preferredCity", "skills", "summary", "updatedAt", "userId", "workAuthorization", "workPreference" FROM "Resume";
DROP TABLE "Resume";
ALTER TABLE "new_Resume" RENAME TO "Resume";
CREATE UNIQUE INDEX "Resume_userId_key" ON "Resume"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
