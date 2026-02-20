import { AdminAuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";

type WriteAdminAuditInput = {
  adminId: string;
  action: AdminAuditAction;
  targetType: string;
  targetId: string;
  summary?: string;
};

export async function writeAdminAuditLog(input: WriteAdminAuditInput) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      summary: input.summary || null,
    },
  });
}
