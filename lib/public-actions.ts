"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertRateLimit } from "@/lib/rate-limit";
import { sendEmail, sendTemplatedEmail } from "@/lib/email";
import { getLocale } from "@/lib/i18n";
import { createRawToken, hashToken } from "@/lib/security-tokens";
import { sendWebhookEvent } from "@/lib/webhooks";

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "yopmail.com",
  "sharklasers.com",
]);

const applicationSchema = z.object({
  jobId: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  website: z.string().max(0).optional().or(z.literal("")),
  cvMode: z.enum(["profile", "upload"]).optional(),
  cvUrl: z.string().url().optional().or(z.literal("")),
  message: z.string().max(800).optional().or(z.literal("")),
});

const registrationSchema = z.object({
  name: z.string().min(2),
  accountType: z.enum(["candidate", "employer"]).default("candidate"),
  email: z.string().email(),
  password: z.string().min(6),
  citizenship: z.string().max(120).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  companyName: z.string().max(160).optional().or(z.literal("")),
  companyCity: z.string().max(120).optional().or(z.literal("")),
  companyWebsite: z.string().max(240).optional().or(z.literal("")),
  privacyAccepted: z.literal(true),
}).superRefine((value, ctx) => {
  if (value.accountType !== "employer") {
    return;
  }

  if (!value.companyName || !value.companyName.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["companyName"],
      message: "Company name is required for employer accounts",
    });
  }

  if (!value.companyCity || !value.companyCity.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["companyCity"],
      message: "Company city is required for employer accounts",
    });
  }

  if (value.companyWebsite && value.companyWebsite.trim()) {
    if (!URL.canParse(value.companyWebsite)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyWebsite"],
        message: "Company website must be a valid URL",
      });
    }
  }
});

const savedJobSchema = z.object({
  jobId: z.string().min(1),
  returnTo: z.string().optional(),
});

function withToast(path: string, toast: "saved" | "unsaved" | "applied" | "apply_error") {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("toast", toast);

  return `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
}

async function logApplyError(params: {
  reason: string;
  path: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.errorLog.create({
      data: {
        source: "apply",
        name: "ApplicationRejected",
        message: `Application rejected: ${params.reason}`,
        path: params.path,
        userId: params.userId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch {
    // Logging should never block user flow.
  }
}

export async function createApplication(formData: FormData) {
  const session = await getCurrentSession();
  if (session?.user.accountType === "employer") {
    await logApplyError({
      reason: "employer_account_forbidden",
      path: "/jobs",
      userId: session.user.id,
    });
    redirect(withToast("/jobs", "apply_error"));
  }
  const candidateIdentity =
    session?.user.id && session.user.accountType === "candidate"
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true },
        })
      : null;

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      applyRateLimitPerHour: true,
      requireCvOnApply: true,
      minApplicationMessageLength: true,
      preventDuplicateApplications: true,
      maintenanceMode: true,
    },
  });

  try {
    await assertRateLimit("APPLY", settings?.applyRateLimitPerHour ?? 25);
  } catch {
    await logApplyError({
      reason: "rate_limit_exceeded",
      path: "/jobs",
      userId: session?.user.id || null,
    });
    redirect(withToast("/jobs", "apply_error"));
  }

  const parsed = applicationSchema.safeParse({
    jobId: formData.get("jobId"),
    fullName: candidateIdentity?.name || formData.get("fullName"),
    email: candidateIdentity?.email || formData.get("email"),
    website: formData.get("website"),
    cvMode: formData.get("cvMode") || "upload",
    cvUrl: normalizeCvUrl(formData.get("cvUrl")),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    await logApplyError({
      reason: "invalid_payload",
      path: "/jobs",
      userId: session?.user.id || null,
      metadata: { issues: parsed.error.issues.map((item) => ({ path: item.path.join("."), message: item.message })) },
    });
    redirect(withToast("/jobs", "apply_error"));
  }

  const cvMode = parsed.data.cvMode || "upload";
  const applicantFullName = candidateIdentity?.name?.trim() || parsed.data.fullName;
  const applicantEmail = candidateIdentity?.email?.trim().toLowerCase() || parsed.data.email;

  if ((settings?.minApplicationMessageLength || 0) > 0 && (parsed.data.message || "").trim().length < (settings?.minApplicationMessageLength || 0)) {
    await logApplyError({
      reason: "message_too_short",
      path: "/jobs",
      userId: session?.user.id || null,
    });
    redirect(withToast("/jobs", "apply_error"));
  }

  if ((parsed.data.website || "").trim().length > 0) {
    await logApplyError({
      reason: "honeypot_triggered",
      path: "/jobs",
      userId: session?.user.id || null,
    });
    redirect(withToast("/jobs", "apply_error"));
  }

  const emailDomain = applicantEmail.split("@")[1]?.toLowerCase() || "";
  if (DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
    await logApplyError({
      reason: "disposable_email_forbidden",
      path: "/jobs",
      userId: session?.user.id || null,
      metadata: { emailDomain },
    });
    redirect(withToast("/jobs", "apply_error"));
  }

  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
    include: {
      createdBy: {
        select: {
          email: true,
          name: true,
          notifyNewApplicationEmail: true,
          preferredLocale: true,
        },
      },
    },
  });

  if (!job || job.status !== "PUBLISHED") {
    await logApplyError({
      reason: "job_not_available",
      path: "/jobs",
      userId: session?.user.id || null,
      metadata: { jobId: parsed.data.jobId },
    });
    redirect(withToast("/jobs", "apply_error"));
  }

  const profileResume = session?.user.id
    ? await prisma.resume.findUnique({
        where: { userId: session.user.id },
      })
    : null;

  const resumeSnapshot =
    cvMode === "profile" && profileResume
      ? JSON.stringify({
          headline: profileResume.headline,
          desiredRole: profileResume.desiredRole,
          preferredCity: profileResume.preferredCity,
          summary: profileResume.summary,
          skills: profileResume.skills,
          experience: profileResume.experience,
          education: profileResume.education,
          links: profileResume.links,
          updatedAt: profileResume.updatedAt.toISOString(),
        })
      : null;

  const finalCvUrl = cvMode === "upload" ? parsed.data.cvUrl || null : null;

  if (settings?.requireCvOnApply) {
    const hasProfileCv = cvMode === "profile" && Boolean(profileResume);
    const hasUploadedCv = cvMode === "upload" && Boolean(finalCvUrl);
    if (!hasProfileCv && !hasUploadedCv) {
      await logApplyError({
        reason: "cv_required_missing",
        path: `/jobs/${job.slug}`,
        userId: session?.user.id || null,
        metadata: { cvMode },
      });
      redirect(withToast(`/jobs/${job.slug}`, "apply_error"));
    }
  }

  if (cvMode === "profile" && !profileResume) {
    await logApplyError({
      reason: "profile_cv_missing",
      path: `/jobs/${job.slug}`,
      userId: session?.user.id || null,
    });
    redirect(withToast(`/jobs/${job.slug}`, "apply_error"));
  }

  const shouldPreventDuplicate = Boolean(session?.user.id) || settings?.preventDuplicateApplications;
  if (shouldPreventDuplicate) {
    const duplicate = await prisma.application.findFirst({
      where: {
        jobId: parsed.data.jobId,
        OR: [{ email: applicantEmail }, ...(session?.user.id ? [{ userId: session.user.id }] : [])],
      },
      select: { id: true },
    });

    if (duplicate) {
      await logApplyError({
        reason: "duplicate_application",
        path: `/jobs/${job.slug}`,
        userId: session?.user.id || null,
        metadata: { jobId: parsed.data.jobId, email: applicantEmail },
      });
      redirect(withToast(`/jobs/${job.slug}`, "apply_error"));
    }
  }

  try {
    const created = await prisma.application.create({
      data: {
        jobId: parsed.data.jobId,
        userId: session?.user.id ?? null,
        fullName: applicantFullName,
        email: applicantEmail,
        cvUrl: finalCvUrl,
        cvSource: cvMode,
        resumeSnapshot,
        message: parsed.data.message || null,
      },
    });

    await sendWebhookEvent("application_created", {
      applicationId: created.id,
      jobId: created.jobId,
      email: created.email,
    });

    if (job.createdBy.notifyNewApplicationEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendTemplatedEmail({
        to: job.createdBy.email,
        templateKey: "NEW_APPLICATION_OWNER",
        locale: job.createdBy.preferredLocale,
        variables: {
          ownerName: job.createdBy.name || "Owner",
          jobTitle: job.title,
          candidateName: created.fullName,
          candidateEmail: created.email,
          applicationsUrl: `${baseUrl.replace(/\/$/, "")}/me/applications`,
        },
      });
    }
  } catch (error) {
    await logApplyError({
      reason: "application_create_failed",
      path: `/jobs/${job.slug}`,
      userId: session?.user.id || null,
      metadata: { error: error instanceof Error ? error.message : "unknown" },
    });
    redirect(withToast(`/jobs/${job.slug}`, "apply_error"));
  }

  revalidatePath(`/jobs/${job.slug}`);
  revalidatePath("/me/candidate/applications");
  revalidatePath("/me/employer/applications");
  revalidatePath("/me/applications");
  redirect(withToast(`/jobs/${job.slug}`, "applied"));
}

export type RegisterUserResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      values: {
        name: string;
        accountType: string;
        email: string;
        password: string;
        citizenship: string;
        birthDate: string;
        companyName: string;
        companyCity: string;
        companyWebsite: string;
      };
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function registerUser(formData: FormData): Promise<RegisterUserResult> {
  const userLocale = await getLocale();
  const asTrimmed = (key: string) => String(formData.get(key) ?? "").trim();
  const normalizeWebsite = (value: string) => {
    if (!value) {
      return "";
    }
    if (URL.canParse(value)) {
      return value;
    }
    const maybeWithProtocol = `https://${value}`;
    return URL.canParse(maybeWithProtocol) ? maybeWithProtocol : value;
  };
  const values = {
    name: asTrimmed("name"),
    accountType: asTrimmed("accountType") || "candidate",
    email: asTrimmed("email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
    citizenship: asTrimmed("citizenship"),
    birthDate: asTrimmed("birthDate"),
    companyName: asTrimmed("companyName"),
    companyCity: asTrimmed("companyCity"),
    companyWebsite: normalizeWebsite(asTrimmed("companyWebsite")),
  };

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { allowPublicRegistration: true, registerRateLimitPerHour: true },
  });

  if (settings?.allowPublicRegistration === false) {
    return { ok: false, error: "Public registration is disabled", values };
  }

  try {
    await assertRateLimit("REGISTER", settings?.registerRateLimitPerHour ?? 10);
  } catch {
    return { ok: false, error: "Too many registration attempts. Please retry later.", values };
  }

  const parsed = registrationSchema.safeParse({
    name: values.name,
    accountType: values.accountType,
    email: values.email,
    password: values.password,
    citizenship: values.citizenship,
    birthDate: values.birthDate,
    companyName: values.companyName,
    companyCity: values.companyCity,
    companyWebsite: values.companyWebsite,
    privacyAccepted: ["1", "true", "on"].includes(String(formData.get("privacyAccepted") ?? "").toLowerCase()),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid registration data",
      values,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (exists) {
    return {
      ok: false,
      error: "User already exists",
      values,
      fieldErrors: { email: ["Email already in use"] },
    };
  }

  const birthDateValue = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
  const birthDate = birthDateValue && !Number.isNaN(birthDateValue.getTime()) ? birthDateValue : null;

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      title:
        parsed.data.accountType === "employer"
          ? `Employer${parsed.data.companyName ? ` - ${parsed.data.companyName}` : ""}`
          : null,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: parsed.data.accountType === "employer" ? "EMPLOYER" : "CANDIDATE",
      accountType: parsed.data.accountType,
      privacyAcceptedAt: new Date(),
      emailVerified: false,
      preferredLocale: userLocale,
      city: parsed.data.accountType === "employer" ? parsed.data.companyCity || null : null,
      website: parsed.data.accountType === "employer" ? parsed.data.companyWebsite || null : null,
      citizenship: parsed.data.accountType === "candidate" ? parsed.data.citizenship || null : null,
      birthDate,
      gender: null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true },
  });

  if (user) {
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
      to: user.email,
      subject: "Verify your email",
      text: `Hi ${user.name},\n\nPlease verify your account:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    });

  }

  return { ok: true };
}

export async function toggleSavedJob(formData: FormData) {
  const parsed = savedJobSchema.safeParse({
    jobId: formData.get("jobId"),
    returnTo: formData.get("returnTo") || undefined,
  });

  if (!parsed.success) {
    redirect(withToast("/jobs", "apply_error"));
  }

  const session = await getCurrentSession();

  if (!session) {
    const callbackUrl = encodeURIComponent(parsed.data.returnTo || "/jobs");
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
    select: { id: true, slug: true },
  });

  if (!job) {
    redirect(withToast("/jobs", "apply_error"));
  }

  const existing = await prisma.savedJob.findUnique({
    where: {
      userId_jobId: {
        userId: session.user.id,
        jobId: job.id,
      },
    },
  });

  let toast: "saved" | "unsaved" = "saved";

  if (existing) {
    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: job.id,
        },
      },
    });
    toast = "unsaved";
  } else {
    await prisma.savedJob.create({
      data: {
        userId: session.user.id,
        jobId: job.id,
      },
    });
  }

  revalidatePath("/jobs");
  revalidatePath("/saved-jobs");
  revalidatePath(`/jobs/${job.slug}`);

  const returnPath = parsed.data.returnTo ? parsed.data.returnTo.split("?")[0] : null;

  if (returnPath) {
    revalidatePath(returnPath);
  }

  redirect(withToast(parsed.data.returnTo || "/jobs", toast));
}
  const normalizeCvUrl = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string") {
      return "";
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    if (trimmed.startsWith("/")) {
      return `${baseUrl}${trimmed}`;
    }
    if (trimmed.startsWith("uploads/")) {
      return `${baseUrl}/${trimmed}`;
    }
    if (URL.canParse(trimmed)) {
      return trimmed;
    }
    const withProtocol = `https://${trimmed}`;
    return URL.canParse(withProtocol) ? withProtocol : trimmed;
  };
