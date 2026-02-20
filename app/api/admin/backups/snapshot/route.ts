import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createBackupSnapshotOnDisk } from "@/lib/admin-governance";
import { reportError } from "@/lib/error-reporting";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { includeUploads?: boolean };
    const output = await createBackupSnapshotOnDisk({
      createdById: session.user.id,
      includeUploads: body.includeUploads !== false,
    });
    return NextResponse.json({ ok: true, output });
  } catch (error) {
    await reportError({
      source: "server",
      name: "BackupSnapshotFailed",
      message: error instanceof Error ? error.message : "Backup snapshot failed.",
      path: "/api/admin/backups/snapshot",
      userId: session.user.id,
    });
    return NextResponse.json({ ok: false, error: "backup_snapshot_failed" }, { status: 500 });
  }
}
