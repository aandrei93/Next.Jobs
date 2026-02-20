import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reportError } from "@/lib/error-reporting";
import { shouldBlockForMaintenance } from "@/lib/maintenance";
import { isAllowedExtensionForMime, isSafeUploadMime, validateFileSignature } from "@/lib/upload-security";

function getExtension(fileName: string, mimeType: string) {
  const fromName = path.extname(fileName || "").replace(".", "").toLowerCase();
  if (fromName) {
    return fromName;
  }

  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };

  return map[mimeType] || "bin";
}

export async function POST(request: Request) {
  if (await shouldBlockForMaintenance()) {
    return NextResponse.json({ ok: false, error: "maintenance_mode" }, { status: 503 });
  }

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "invalid_file" }, { status: 400 });
  }

  const maxBytes = settings.maxUploadMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
  }

  const allowedMimeTypes = (settings.allowedMimeTypes || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowedMimeTypes.length && !allowedMimeTypes.includes(file.type)) {
    return NextResponse.json({ ok: false, error: "mime_not_allowed" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = getExtension(file.name, file.type);

  if (!isSafeUploadMime(file.type)) {
    await reportError({
      source: "server",
      name: "UploadRejected",
      message: "Upload rejected: unsupported mime type.",
      path: "/api/upload",
      userId: session.user.id,
      metadata: JSON.stringify({ mimeType: file.type }),
    });
    return NextResponse.json({ ok: false, error: "mime_not_allowed" }, { status: 400 });
  }

  if (!isAllowedExtensionForMime(file.type, extension)) {
    await reportError({
      source: "server",
      name: "UploadRejected",
      message: "Upload rejected: extension does not match mime type.",
      path: "/api/upload",
      userId: session.user.id,
      metadata: JSON.stringify({ mimeType: file.type, extension }),
    });
    return NextResponse.json({ ok: false, error: "mime_extension_mismatch" }, { status: 400 });
  }

  if (!validateFileSignature(file.type, buffer)) {
    await reportError({
      source: "server",
      name: "UploadRejected",
      message: "Upload rejected: file signature mismatch.",
      path: "/api/upload",
      userId: session.user.id,
      metadata: JSON.stringify({ mimeType: file.type, extension }),
    });
    return NextResponse.json({ ok: false, error: "file_signature_invalid" }, { status: 400 });
  }

  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, fileName), buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${fileName}` });
}
