import path from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
  }

  const fullPath = path.join(process.cwd(), "backups", name);
  if (!existsSync(fullPath)) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const buffer = await readFile(fullPath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
