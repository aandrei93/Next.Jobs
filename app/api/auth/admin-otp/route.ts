import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { adminTwoFactorRequired: true },
  });

  if (!settings?.adminTwoFactorRequired) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.adminLoginOtp.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt,
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Admin login verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
  });

  return NextResponse.json({ ok: true });
}
