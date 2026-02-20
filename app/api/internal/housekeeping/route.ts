import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidInternalSecret } from "@/lib/internal-auth";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "n/a";
  const providedSecret = request.headers.get("x-housekeeping-secret");
  const expectedSecret = process.env.HOUSEKEEPING_SECRET;

  if (!isValidInternalSecret(providedSecret, expectedSecret)) {
    log("warn", "housekeeping.unauthorized", { requestId });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const now = new Date();
  const appRetentionDate = new Date(now.getTime() - settings.applicationRetentionDays * 24 * 60 * 60 * 1000);
  const draftRetentionDate = new Date(now.getTime() - settings.draftRetentionDays * 24 * 60 * 60 * 1000);

  const [closedJobs, deletedApplications, deletedDrafts, deletedUniqueViews] = await Promise.all([
    settings.autoCloseExpiredJobs
      ? prisma.job.updateMany({
          where: {
            status: "PUBLISHED",
            expirationDate: { lt: now },
          },
          data: {
            status: "CLOSED",
          },
        })
      : Promise.resolve({ count: 0 }),
    prisma.application.deleteMany({
      where: {
        createdAt: { lt: appRetentionDate },
      },
    }),
    prisma.job.deleteMany({
      where: {
        status: "DRAFT",
        createdAt: { lt: draftRetentionDate },
      },
    }),
    prisma.jobUniqueView.deleteMany({
      where: {
        createdAt: { lt: appRetentionDate },
      },
    }),
  ]);

  log("info", "housekeeping.completed", {
    requestId,
    closedJobs: closedJobs.count,
    deletedApplications: deletedApplications.count,
    deletedDrafts: deletedDrafts.count,
    deletedUniqueViews: deletedUniqueViews.count,
  });

  return NextResponse.json({
    ok: true,
    closedJobs: closedJobs.count,
    deletedApplications: deletedApplications.count,
    deletedDrafts: deletedDrafts.count,
    deletedUniqueViews: deletedUniqueViews.count,
  });
}
