import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "n/a";
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      status: "healthy",
      db: "up",
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        db: "down",
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
