"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, sendTemplatedEmail } from "@/lib/email";
import { createRawToken, hashToken } from "@/lib/security-tokens";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(12),
  password: z.string().min(6),
});

const verifyEmailSchema = z.object({
  token: z.string().min(12),
});

const updateCredentialsSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
  newEmail: z.string().email().optional().or(z.literal("")),
});

function buildProfileRedirect(status: string) {
  return `/me/profile?security=${encodeURIComponent(status)}`;
}

export async function verifyEmailToken(formData: FormData) {
  const parsed = verifyEmailSchema.safeParse({
    token: formData.get("token"),
  });

  if (!parsed.success) {
    redirect("/verify-email?status=invalid");
  }

  const tokenHash = hashToken(parsed.data.token);
  const entry = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
          name: true,
          preferredLocale: true,
          emailVerified: true,
          createdAt: true,
        },
      },
    },
  });

  if (!entry) {
    redirect("/verify-email?status=invalid");
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: entry.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: entry.userId },
      data: { emailVerified: true },
    }),
  ]);

  const isFirstActivationWindow = Date.now() - entry.user.createdAt.getTime() < 1000 * 60 * 60 * 48;
  if (!entry.user.emailVerified && isFirstActivationWindow) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const loginUrl = `${baseUrl.replace(/\/$/, "")}/login`;
    await sendTemplatedEmail({
      to: entry.user.email,
      templateKey: "WELCOME_CANDIDATE",
      locale: entry.user.preferredLocale || "ro",
      variables: {
        name: entry.user.name || "User",
        email: entry.user.email,
        password: "******",
        loginUrl,
      },
    });
  }

  redirect("/verify-email?status=ok");
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect("/forgot-password?status=sent");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true },
  });

  if (user) {
    const rawToken = createRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      text: `Hi ${user.name},\n\nReset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    });
  }

  redirect("/forgot-password?status=sent");
}

export async function resetPassword(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/reset-password?status=invalid");
  }

  const tokenHash = hashToken(parsed.data.token);
  const entry = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    select: { id: true, userId: true },
  });

  if (!entry) {
    redirect("/reset-password?status=invalid");
  }

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: entry.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: entry.userId },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        sessionVersion: { increment: 1 },
      },
    }),
  ]);

  redirect("/login?reset=1");
}

export async function logoutAllDevices() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { sessionVersion: { increment: 1 } },
  });

  revalidatePath("/me/profile");
  redirect("/login?logout_all=1");
}

export async function updateMyCredentials(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const parsed = updateCredentialsSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
    newEmail: formData.get("newEmail"),
  });

  if (!parsed.success) {
    redirect(buildProfileRedirect("invalid"));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user) {
    redirect(buildProfileRedirect("invalid"));
  }

  const passwordOk = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!passwordOk) {
    redirect(buildProfileRedirect("current_password_invalid"));
  }

  const newPassword = (parsed.data.newPassword || "").trim();
  const confirmPassword = (parsed.data.confirmPassword || "").trim();
  const newEmail = (parsed.data.newEmail || "").trim().toLowerCase();

  const wantsPasswordChange = newPassword.length > 0 || confirmPassword.length > 0;
  const wantsEmailChange = newEmail.length > 0 && newEmail !== user.email.toLowerCase();

  if (!wantsPasswordChange && !wantsEmailChange) {
    redirect(buildProfileRedirect("nothing_changed"));
  }

  if (wantsPasswordChange) {
    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      redirect(buildProfileRedirect("password_mismatch"));
    }
  }

  if (wantsEmailChange) {
    const existing = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });
    if (existing && existing.id !== user.id) {
      redirect(buildProfileRedirect("email_taken"));
    }
  }

  const nextSessionVersion = wantsPasswordChange ? { increment: 1 } : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(wantsPasswordChange ? { passwordHash: await bcrypt.hash(newPassword, 10), sessionVersion: nextSessionVersion } : {}),
      ...(wantsEmailChange ? { email: newEmail, emailVerified: false } : {}),
    },
  });

  if (wantsEmailChange) {
    const rawToken = createRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl.replace(/\/$/, "")}/verify-email?token=${rawToken}`;

    await sendEmail({
      to: newEmail,
      subject: "Verify your new email",
      text: `Hi ${user.name},\n\nConfirm your new email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    });
  }

  revalidatePath("/me/profile");
  redirect(buildProfileRedirect(wantsEmailChange ? "updated_verify_email" : "updated"));
}
