import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";

type ReportErrorInput = {
  source: "client" | "server";
  message: string;
  name?: string | null;
  stack?: string | null;
  digest?: string | null;
  path?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  userId?: string | null;
};

function trimValue(value: string | null | undefined, max: number) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, max);
}

export async function reportError(input: ReportErrorInput) {
  const message = trimValue(input.message, 2000);
  if (!message) {
    return;
  }

  try {
    await prisma.errorLog.create({
      data: {
        source: input.source,
        message,
        name: trimValue(input.name, 240),
        stack: trimValue(input.stack, 12000),
        digest: trimValue(input.digest, 200),
        path: trimValue(input.path, 800),
        userAgent: trimValue(input.userAgent, 500),
        metadata: trimValue(input.metadata, 4000),
        userId: trimValue(input.userId, 120),
      },
    });
  } catch (error) {
    log("error", "error_log_persist_failed", {
      originalMessage: message,
      persistError: error instanceof Error ? error.message : "unknown",
    });
  }
}
