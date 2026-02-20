import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildBackupZipBuffer } from "@/lib/admin-ops";

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function logAdminChange(input: {
  adminId: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await prisma.adminChangeLog.create({
      data: {
        adminId: input.adminId,
        entityType: input.entityType,
        entityId: input.entityId || null,
        action: input.action,
        beforeJson: safeJson(input.before),
        afterJson: safeJson(input.after),
      },
    });
  } catch {
    // Audit should never block primary admin actions.
  }
}

export async function createAdminTask(input: {
  createdById: string;
  type: string;
  input?: unknown;
}) {
  return prisma.adminTask.create({
    data: {
      createdById: input.createdById,
      type: input.type,
      status: "PENDING",
      inputJson: safeJson(input.input),
    },
  });
}

export async function startAdminTask(taskId: string) {
  await prisma.adminTask.update({
    where: { id: taskId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      errorText: null,
    },
  });
}

export async function completeAdminTask(taskId: string, output?: unknown) {
  await prisma.adminTask.update({
    where: { id: taskId },
    data: {
      status: "DONE",
      finishedAt: new Date(),
      outputJson: safeJson(output),
    },
  });
}

export async function failAdminTask(taskId: string, errorText: string, output?: unknown) {
  await prisma.adminTask.update({
    where: { id: taskId },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      errorText,
      outputJson: safeJson(output),
    },
  });
}

export async function createBackupSnapshotOnDisk(input: {
  createdById: string;
  includeUploads: boolean;
}) {
  const task = await createAdminTask({
    createdById: input.createdById,
    type: "BACKUP_SNAPSHOT",
    input: { includeUploads: input.includeUploads },
  });

  await startAdminTask(task.id);
  try {
    const backup = await buildBackupZipBuffer(input.includeUploads);
    const backupsDir = path.join(process.cwd(), "backups");
    await mkdir(backupsDir, { recursive: true });
    const targetPath = path.join(backupsDir, backup.fileName);
    await writeFile(targetPath, backup.buffer);

    const output = {
      fileName: backup.fileName,
      filePath: targetPath,
      downloadPath: `/api/admin/backups/file?name=${encodeURIComponent(backup.fileName)}`,
    };
    await completeAdminTask(task.id, output);
    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : "backup_snapshot_failed";
    await failAdminTask(task.id, message);
    throw error;
  }
}

export function parseTaskOutput(outputJson: string | null) {
  if (!outputJson) return null;
  try {
    return JSON.parse(outputJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function toSiteSettingsPersistable(
  value: Record<string, unknown>
): Prisma.SiteSettingsUncheckedUpdateInput {
  const payload = { ...value };
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  return payload as Prisma.SiteSettingsUncheckedUpdateInput;
}
