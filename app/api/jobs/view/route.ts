import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { shouldBlockForMaintenance } from "@/lib/maintenance";

const VISITOR_TOKEN_COOKIE = "jobs_visitor_token";
const VISITOR_TOKEN_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 180;

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "n/a";
  if (await shouldBlockForMaintenance()) {
    log("warn", "jobs.view.blocked_maintenance", { requestId });
    return NextResponse.json({ ok: false, error: "maintenance_mode" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { jobId?: string } | null;
  const jobId = typeof body?.jobId === "string" ? body.jobId : "";

  if (!jobId) {
    log("warn", "jobs.view.missing_job_id", { requestId });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const session = await getCurrentSession();
  let visitorToken = request.cookies.get(VISITOR_TOKEN_COOKIE)?.value || "";
  let shouldSetVisitorCookie = false;

  if (!session?.user?.id) {
    if (!visitorToken) {
      visitorToken = randomUUID();
      shouldSetVisitorCookie = true;
    }
  }

  let counted = false;
  try {
    if (session?.user?.id) {
      const existing = await prisma.jobUniqueView.findUnique({
        where: {
          jobId_userId: {
            jobId,
            userId: session.user.id,
          },
        },
        select: { id: true },
      });

      if (!existing) {
        await prisma.$transaction([
          prisma.jobUniqueView.create({
            data: {
              jobId,
              userId: session.user.id,
            },
          }),
          prisma.job.update({
            where: { id: jobId },
            data: { viewsCount: { increment: 1 } },
          }),
        ]);
        counted = true;
      }
    } else {
      const existing = await prisma.jobUniqueView.findUnique({
        where: {
          jobId_visitorToken: {
            jobId,
            visitorToken,
          },
        },
        select: { id: true },
      });

      if (!existing) {
        await prisma.$transaction([
          prisma.jobUniqueView.create({
            data: {
              jobId,
              visitorToken,
            },
          }),
          prisma.job.update({
            where: { id: jobId },
            data: { viewsCount: { increment: 1 } },
          }),
        ]);
        counted = true;
      }
    }
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ ok: false }, { status: 404 });
      }
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  const response = NextResponse.json({ ok: true, counted });
  log("info", "jobs.view.tracked", { requestId, jobId, counted, authenticated: Boolean(session?.user?.id) });
  if (shouldSetVisitorCookie) {
    response.cookies.set({
      name: VISITOR_TOKEN_COOKIE,
      value: visitorToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_TOKEN_COOKIE_TTL_SECONDS,
    });
  }

  return response;
}
