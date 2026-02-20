import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { buildBackupZipBuffer } from "@/lib/admin-ops";
import { completeAdminTask, createAdminTask, failAdminTask, startAdminTask } from "@/lib/admin-governance";
import { reportError } from "@/lib/error-reporting";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let taskId: string | null = null;
  try {
    const url = new URL(request.url);
    const includeUploads = url.searchParams.get("includeUploads") !== "0";
    const task = await createAdminTask({
      createdById: session.user.id,
      type: "BACKUP_EXPORT",
      input: { includeUploads },
    });
    taskId = task.id;
    await startAdminTask(task.id);
    const backup = await buildBackupZipBuffer(includeUploads);
    await completeAdminTask(task.id, { fileName: backup.fileName, bytes: backup.buffer.length });

    return new NextResponse(new Uint8Array(backup.buffer), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${backup.fileName}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (taskId) {
      await failAdminTask(taskId, error instanceof Error ? error.message : "backup_export_failed");
    }
    await reportError({
      source: "server",
      name: "BackupExportFailed",
      message: error instanceof Error ? error.message : "Backup export failed.",
      path: "/api/admin/backups/export",
      userId: session.user.id,
    });

    return NextResponse.json({ ok: false, error: "backup_export_failed" }, { status: 500 });
  }
}
