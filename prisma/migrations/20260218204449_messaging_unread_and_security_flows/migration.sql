-- AlterTable
ALTER TABLE "Application" ADD COLUMN "lastMessageAt" DATETIME;
ALTER TABLE "Application" ADD COLUMN "lastReadByCandidateAt" DATETIME;
ALTER TABLE "Application" ADD COLUMN "lastReadByOwnerAt" DATETIME;
