-- AlterTable
ALTER TABLE "Company" ADD COLUMN "companySize" TEXT;
ALTER TABLE "Company" ADD COLUMN "foundedYear" INTEGER;
ALTER TABLE "Company" ADD COLUMN "industry" TEXT;
ALTER TABLE "Company" ADD COLUMN "registrationNumber" TEXT;
ALTER TABLE "Company" ADD COLUMN "vatNumber" TEXT;

-- CreateTable
CREATE TABLE "CategorySuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "suggestedById" TEXT NOT NULL,
    "companyId" TEXT,
    CONSTRAINT "CategorySuggestion_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CategorySuggestion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inputJson" TEXT,
    "outputJson" TEXT,
    "errorText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "AdminTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,
    CONSTRAINT "AdminChangeLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteSettingsVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settingsJson" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "restoredFromId" TEXT,
    CONSTRAINT "SiteSettingsVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeletedJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalId" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedById" TEXT,
    "restoredAt" DATETIME,
    "restoredById" TEXT,
    CONSTRAINT "DeletedJob_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeletedJob_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeletedCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalId" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedById" TEXT,
    "restoredAt" DATETIME,
    "restoredById" TEXT,
    CONSTRAINT "DeletedCompany_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeletedCompany_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeletedCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalId" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedById" TEXT,
    "restoredAt" DATETIME,
    "restoredById" TEXT,
    CONSTRAINT "DeletedCategory_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeletedCategory_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CategorySuggestion_status_createdAt_idx" ON "CategorySuggestion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CategorySuggestion_suggestedById_createdAt_idx" ON "CategorySuggestion"("suggestedById", "createdAt");

-- CreateIndex
CREATE INDEX "CategorySuggestion_companyId_createdAt_idx" ON "CategorySuggestion"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CategorySuggestion_normalizedName_idx" ON "CategorySuggestion"("normalizedName");

-- CreateIndex
CREATE INDEX "AdminTask_status_createdAt_idx" ON "AdminTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminTask_type_createdAt_idx" ON "AdminTask"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AdminTask_createdById_createdAt_idx" ON "AdminTask"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "AdminChangeLog_entityType_createdAt_idx" ON "AdminChangeLog"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "AdminChangeLog_adminId_createdAt_idx" ON "AdminChangeLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "SiteSettingsVersion_createdAt_idx" ON "SiteSettingsVersion"("createdAt");

-- CreateIndex
CREATE INDEX "SiteSettingsVersion_createdById_createdAt_idx" ON "SiteSettingsVersion"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "DeletedJob_deletedAt_idx" ON "DeletedJob"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeletedJob_originalId_key" ON "DeletedJob"("originalId");

-- CreateIndex
CREATE INDEX "DeletedCompany_deletedAt_idx" ON "DeletedCompany"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeletedCompany_originalId_key" ON "DeletedCompany"("originalId");

-- CreateIndex
CREATE INDEX "DeletedCategory_deletedAt_idx" ON "DeletedCategory"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeletedCategory_originalId_key" ON "DeletedCategory"("originalId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_registrationNumber_key" ON "Company"("registrationNumber");
