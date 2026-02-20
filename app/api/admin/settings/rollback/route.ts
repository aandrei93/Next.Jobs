import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAdminChange, toSiteSettingsPersistable } from "@/lib/admin-governance";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      versionId?: string;
      confirmText?: string;
      adminPassword?: string;
    };

    if (!body.versionId || String(body.confirmText || "").toUpperCase() !== "DELETE") {
      return NextResponse.json({ ok: false, error: "invalid_confirmation" }, { status: 400 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!admin) {
      return NextResponse.json({ ok: false, error: "admin_not_found" }, { status: 404 });
    }
    const valid = await bcrypt.compare(String(body.adminPassword || ""), admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 403 });
    }

    const version = await prisma.siteSettingsVersion.findUnique({
      where: { id: body.versionId },
      select: { settingsJson: true },
    });
    if (!version) {
      return NextResponse.json({ ok: false, error: "version_not_found" }, { status: 404 });
    }

    const current = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    const payload = JSON.parse(version.settingsJson) as Record<string, unknown>;
    const restorePayload = toSiteSettingsPersistable(payload);

    await prisma.siteSettingsVersion.create({
      data: {
        settingsJson: JSON.stringify(current),
        reason: "before_rollback",
        restoredFromId: body.versionId,
      },
    });

    const updated = await prisma.siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...(restorePayload as Record<string, unknown>),
      },
      update: restorePayload,
    });

    await logAdminChange({
      adminId: session.user.id,
      entityType: "site_settings",
      entityId: "default",
      action: "rollback",
      before: current,
      after: updated,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "rollback_failed" }, { status: 500 });
  }
}
