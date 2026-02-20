"use server";

import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTemplatedEmail } from "@/lib/email";

const updateStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(ApplicationStatus),
});

const messageSchema = z.object({
  applicationId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

const noteSchema = z.object({
  applicationId: z.string().min(1),
  content: z.string().min(1).max(1500),
});

async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function updateApplicationPipelineStatus(formData: FormData) {
  const session = await requireSession();
  const parsed = updateStatusSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return;
  }

  const application = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    select: {
      id: true,
      job: { select: { createdById: true } },
    },
  });

  if (!application) {
    return;
  }

  if (session.user.role !== "ADMIN" && application.job.createdById !== session.user.id) {
    return;
  }

  await prisma.application.update({
    where: { id: application.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/me/applications");
  revalidatePath("/admin/applications");
}

export async function sendApplicationMessage(formData: FormData) {
  const session = await requireSession();
  const parsed = messageSchema.safeParse({
    applicationId: formData.get("applicationId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return;
  }

  const application = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    select: {
      id: true,
      userId: true,
      job: { select: { createdById: true, title: true } },
    },
  });

  if (!application) {
    return;
  }

  const canWrite =
    session.user.role === "ADMIN" ||
    application.job.createdById === session.user.id ||
    (application.userId && application.userId === session.user.id);

  if (!canWrite) {
    return;
  }

  await prisma.applicationMessage.create({
    data: {
      applicationId: application.id,
      senderId: session.user.id,
      content: parsed.data.content.trim(),
    },
  });

  const now = new Date();
  const isCandidate = Boolean(application.userId && application.userId === session.user.id);
  const isOwner = application.job.createdById === session.user.id;

  await prisma.application.update({
    where: { id: application.id },
    data: {
      lastMessageAt: now,
      lastReadByCandidateAt: isCandidate ? now : undefined,
      lastReadByOwnerAt: isOwner ? now : undefined,
    },
  });

  if (isCandidate) {
    const owner = await prisma.user.findUnique({
      where: { id: application.job.createdById },
      select: { email: true, notifyNewApplicationEmail: true, name: true, preferredLocale: true },
    });
    if (owner?.notifyNewApplicationEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendTemplatedEmail({
        to: owner.email,
        templateKey: "NEW_MESSAGE_OWNER",
        locale: owner.preferredLocale,
        variables: {
          ownerName: owner.name || "Owner",
          jobTitle: application.job.title,
          applicationsUrl: `${baseUrl.replace(/\/$/, "")}/me/applications`,
        },
      });
    }
  } else if (application.userId && isOwner) {
    const candidate = await prisma.user.findUnique({
      where: { id: application.userId },
      select: { email: true, name: true, preferredLocale: true },
    });
    if (candidate) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendTemplatedEmail({
        to: candidate.email,
        templateKey: "NEW_MESSAGE_CANDIDATE",
        locale: candidate.preferredLocale,
        variables: {
          candidateName: candidate.name || "Candidate",
          jobTitle: application.job.title,
          applicationsUrl: `${baseUrl.replace(/\/$/, "")}/me/applications`,
        },
      });
    }
  }

  revalidatePath("/me/applications");
  revalidatePath("/admin/applications");
}

export async function addApplicationNote(formData: FormData) {
  const session = await requireSession();
  const parsed = noteSchema.safeParse({
    applicationId: formData.get("applicationId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return;
  }

  const application = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    select: {
      id: true,
      job: { select: { createdById: true } },
    },
  });

  if (!application) {
    return;
  }

  if (session.user.role !== "ADMIN" && application.job.createdById !== session.user.id) {
    return;
  }

  await prisma.applicationNote.create({
    data: {
      applicationId: application.id,
      authorId: session.user.id,
      content: parsed.data.content.trim(),
    },
  });

  revalidatePath("/me/applications");
  revalidatePath("/admin/applications");
}
