import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { reportError } from "@/lib/error-reporting";
import { completeAdminTask, createAdminTask, failAdminTask, startAdminTask } from "@/lib/admin-governance";
import { restoreFromBackupZip } from "@/lib/admin-ops";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let taskId: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const replaceUploads = formData.get("replaceUploads") === "1";
    const task = await createAdminTask({
      createdById: session.user.id,
      type: "BACKUP_IMPORT",
      input: { replaceUploads, fileName: file instanceof File ? file.name : null },
    });
    taskId = task.id;
    await startAdminTask(task.id);

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "invalid_file" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ ok: false, error: "invalid_archive_type" }, { status: 400 });
    }

    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "archive_too_large" }, { status: 400 });
    }

    await prisma.$disconnect();
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await restoreFromBackupZip(buffer, replaceUploads);
    await completeAdminTask(task.id, { restoredUploads: result.restoredUploads });

    return NextResponse.json({ ok: true, restoredUploads: result.restoredUploads });
  } catch (error) {
    if (taskId) {
      await failAdminTask(taskId, error instanceof Error ? error.message : "backup_import_failed");
    }
    await reportError({
      source: "server",
      name: "BackupImportFailed",
      message: error instanceof Error ? error.message : "Backup import failed.",
      path: "/api/admin/backups/import",
      userId: session.user.id,
    });

    return NextResponse.json({ ok: false, error: "backup_import_failed" }, { status: 500 });
  }
}
