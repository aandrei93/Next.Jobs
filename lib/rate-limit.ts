import { headers } from "next/headers";
import { RateLimitAction } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getRequestIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function assertRateLimit(action: RateLimitAction, maxPerHour: number, ip?: string) {
  if (maxPerHour <= 0) {
    return;
  }

  const clientIp = ip || (await getRequestIp());
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const count = await prisma.rateLimitEvent.count({
    where: {
      action,
      ip: clientIp,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (count >= maxPerHour) {
    throw new Error("rate_limit_exceeded");
  }

  await prisma.rateLimitEvent.create({
    data: {
      action,
      ip: clientIp,
    },
  });
}
