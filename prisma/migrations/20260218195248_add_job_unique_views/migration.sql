-- CreateTable
CREATE TABLE "JobUniqueView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobUniqueView_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobUniqueView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "JobUniqueView_userId_createdAt_idx" ON "JobUniqueView"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "JobUniqueView_jobId_createdAt_idx" ON "JobUniqueView"("jobId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobUniqueView_jobId_userId_key" ON "JobUniqueView"("jobId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobUniqueView_jobId_visitorToken_key" ON "JobUniqueView"("jobId", "visitorToken");
