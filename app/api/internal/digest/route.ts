import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isValidInternalSecret } from "@/lib/internal-auth";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "n/a";
  const providedSecret = request.headers.get("x-housekeeping-secret");
  const expectedSecret = process.env.HOUSEKEEPING_SECRET;

  if (!isValidInternalSecret(providedSecret, expectedSecret)) {
    log("warn", "digest.unauthorized", { requestId });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const applications = await prisma.application.findMany({
    where: {
      createdAt: { gte: since },
      job: {
        createdBy: {
          notifyDigestEmail: true,
        },
      },
    },
    select: {
      id: true,
      job: {
        select: {
          title: true,
          createdBy: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  const byOwner = new Map<string, { email: string; name: string; total: number; byJob: Map<string, number> }>();
  for (const app of applications) {
    const ownerId = app.job.createdBy.id;
    if (!byOwner.has(ownerId)) {
      byOwner.set(ownerId, {
        email: app.job.createdBy.email,
        name: app.job.createdBy.name,
        total: 0,
        byJob: new Map(),
      });
    }
    const row = byOwner.get(ownerId)!;
    row.total += 1;
    row.byJob.set(app.job.title, (row.byJob.get(app.job.title) || 0) + 1);
  }

  let sent = 0;
  for (const row of byOwner.values()) {
    const jobLines = Array.from(row.byJob.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([title, count]) => `- ${title}: ${count}`)
      .join("\n");

    const ok = await sendEmail({
      to: row.email,
      subject: `Daily digest: ${row.total} new application(s)`,
      text: `Hi ${row.name},\n\nYou received ${row.total} new application(s) in the last 24h.\n\n${jobLines}\n\n- NextJobs`,
    });

    if (ok) {
      sent += 1;
    }
  }

  log("info", "digest.completed", {
    requestId,
    ownersWithDigest: byOwner.size,
    sent,
    applications: applications.length,
  });

  return NextResponse.json({
    ok: true,
    ownersWithDigest: byOwner.size,
    sent,
    applications: applications.length,
  });
}
