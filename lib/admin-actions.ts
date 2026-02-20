"use server";

import { ApplicationStatus, EmploymentType, JobStatus, UserRole, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getCurrentSession } from "@/lib/auth";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { logAdminChange, toSiteSettingsPersistable } from "@/lib/admin-governance";
import { CURRENCY_CODES } from "@/lib/currencies";
import { prisma } from "@/lib/db";
import { sendEmail, sendTemplatedEmail } from "@/lib/email";
import { sanitizeRichText, stripRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/utils";

type AdminToastCode = "admin_success" | "admin_error";
const LOCALE_CODES = ["ro", "en"] as const;

function withToast(path: string, toast: AdminToastCode) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("toast", toast);

  return `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
}

function redirectAdminError(path: string): never {
  redirect(withToast(path, "admin_error"));
}

function redirectAdminSuccess(path: string): never {
  redirect(withToast(path, "admin_success"));
}

async function requireAdmin() {
  const session = await getCurrentSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return session;
}

async function requireDestructiveConfirmation(formData: FormData, adminId: string, fallbackPath: string) {
  const confirmText = String(formData.get("confirmText") || "").trim().toUpperCase();
  const adminPassword = String(formData.get("adminPassword") || "");

  if (confirmText !== "DELETE" || adminPassword.length < 4) {
    redirectAdminError(fallbackPath);
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { passwordHash: true },
  });

  if (!admin) {
    redirectAdminError(fallbackPath);
  }

  const valid = await bcrypt.compare(adminPassword, admin.passwordHash);
  if (!valid) {
    redirectAdminError(fallbackPath);
  }
}

const categorySchema = z.object({
  name: z.string().min(2),
});

const categorySuggestionModerationSchema = z.object({
  id: z.string().min(1),
  adminNote: z.string().max(600).optional().or(z.literal("")),
});

const jobSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  description: z.string().min(20),
  location: z.string().min(2),
  companyId: z.string().min(1),
  categoryId: z.string().optional(),
  employmentType: z.enum(EmploymentType),
  status: z.enum(JobStatus),
  isRemote: z.boolean(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  currency: z.enum(CURRENCY_CODES),
  expirationDate: z.coerce.date().optional(),
});

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(UserRole),
});

const moderationSchema = z.object({
  id: z.string().min(1),
  moderationNote: z.string().max(600).optional().or(z.literal("")),
});

const companySuspensionSchema = z.object({
  id: z.string().min(1),
  suspend: z.boolean(),
});

const companyVerificationSchema = z.object({
  id: z.string().min(1),
  verify: z.boolean(),
});

const siteSettingsSchema = z.object({
  siteName: z.string().min(2).max(80),
  defaultLocale: z.enum(LOCALE_CODES),
  siteTagline: z.string().max(140).optional().or(z.literal("")),
  supportEmail: z.string().email().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional().or(z.literal("")),
  defaultCurrency: z.enum(CURRENCY_CODES),
  defaultJobExpirationDays: z.coerce.number().int().min(7).max(180),
  jobsPerPage: z.coerce.number().int().min(6).max(100),
  adminDashboardDefaultRange: z.enum(["7d", "30d", "90d"]),
  homeFeaturedJobsCount: z.coerce.number().int().min(4).max(24),
  jobsDefaultPostedFilter: z.enum(["any", "24h", "7d", "30d"]),
  maintenanceScope: z.enum(["PUBLIC_ONLY", "ALL_NON_ADMIN"]),
  loginRateLimitPerHour: z.coerce.number().int().min(1).max(500),
  registerRateLimitPerHour: z.coerce.number().int().min(1).max(500),
  applyRateLimitPerHour: z.coerce.number().int().min(1).max(500),
  requireCvOnApply: z.boolean(),
  minApplicationMessageLength: z.coerce.number().int().min(0).max(800),
  preventDuplicateApplications: z.boolean(),
  blockedKeywords: z.string().max(2000).optional().or(z.literal("")),
  minJobDescriptionLength: z.coerce.number().int().min(20).max(4000),
  allowCandidatePosting: z.boolean(),
  allowPublicRegistration: z.boolean(),
  requireCompanyBeforePosting: z.boolean(),
  autoApproveCandidateJobs: z.boolean(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().max(300).optional().or(z.literal("")),
  seoNoIndex: z.boolean(),
  seoCanonicalUrl: z.string().max(500).optional().or(z.literal("")),
  seoDefaultOgImage: z.string().max(500).optional().or(z.literal("")),
  siteFaviconUrl: z.string().max(500).optional().or(z.literal("")),
  enableSitemap: z.boolean(),
  gaMeasurementId: z.string().max(24).optional().or(z.literal("")),
  smtpHost: z.string().max(120).optional().or(z.literal("")),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().max(120).optional().or(z.literal("")),
  smtpPassword: z.string().max(180).optional().or(z.literal("")),
  // Accepts formats like "NextJobs <noreply@domain.tld>" used by SMTP providers.
  smtpFrom: z.string().max(220).optional().or(z.literal("")),
  smtpSecure: z.boolean(),
  adminSessionMaxHours: z.coerce.number().int().min(1).max(168),
  maxFailedLogins: z.coerce.number().int().min(1).max(100),
  adminTwoFactorRequired: z.boolean(),
  maxUploadMb: z.coerce.number().int().min(1).max(200),
  allowedMimeTypes: z.string().max(1500).optional().or(z.literal("")),
  defaultTimezone: z.string().max(80),
  dateFormat: z.string().max(40),
  allowedCountries: z.string().max(1200).optional().or(z.literal("")),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  webhookSecret: z.string().max(240).optional().or(z.literal("")),
  featureSavedJobs: z.boolean(),
  featureResumeBuilder: z.boolean(),
  featurePublicProfiles: z.boolean(),
  autoCloseExpiredJobs: z.boolean(),
  applicationRetentionDays: z.coerce.number().int().min(7).max(3650),
  draftRetentionDays: z.coerce.number().int().min(7).max(3650),
});

function parseJobPayload(formData: FormData, fallbackPath: string) {
  const salaryMinRaw = formData.get("salaryMin");
  const salaryMaxRaw = formData.get("salaryMax");

  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    location: formData.get("location"),
    companyId: formData.get("companyId"),
    categoryId: formData.get("categoryId") || undefined,
    employmentType: formData.get("employmentType"),
    status: formData.get("status"),
    isRemote: formData.get("isRemote") === "on",
    salaryMin: typeof salaryMinRaw === "string" && salaryMinRaw ? Number(salaryMinRaw) : undefined,
    salaryMax: typeof salaryMaxRaw === "string" && salaryMaxRaw ? Number(salaryMaxRaw) : undefined,
    currency: String(formData.get("currency") || "EUR").toUpperCase(),
    expirationDate: formData.get("expirationDate") || undefined,
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  return parsed.data;
}

function defaultExpirationDate() {
  const value = new Date();
  value.setDate(value.getDate() + 30);
  return value;
}

function buildReferenceNumber() {
  return `#${Date.now().toString().slice(-8)}`;
}

export async function deleteCompany(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/companies";
  const id = formData.get("id");

  if (typeof id !== "string") {
    redirectAdminError(fallbackPath);
  }

  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    });
    if (!company || company._count.jobs > 0) {
      redirectAdminError(fallbackPath);
    }

    await prisma.$transaction([
      prisma.deletedCompany.upsert({
        where: { originalId: company.id },
        create: {
          originalId: company.id,
          payloadJson: JSON.stringify(company),
          deletedById: session.user.id,
        },
        update: {
          payloadJson: JSON.stringify(company),
          deletedById: session.user.id,
          deletedAt: new Date(),
          restoredAt: null,
          restoredById: null,
        },
      }),
      prisma.company.delete({ where: { id } }),
    ]);
    await logAdminChange({
      adminId: session.user.id,
      entityType: "company",
      entityId: company.id,
      action: "soft_delete",
      before: company,
      after: null,
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/companies");
  revalidatePath("/admin/trash");
  redirectAdminSuccess(fallbackPath);
}

export async function toggleCompanySuspension(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/companies";

  const parsed = companySuspensionSchema.safeParse({
    id: formData.get("id"),
    suspend: formData.get("suspend") === "1",
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    await prisma.company.update({
      where: { id: parsed.data.id },
      data: { isSuspended: parsed.data.suspend },
    });
    await writeAdminAuditLog({
      adminId: session.user.id,
      action: parsed.data.suspend ? "COMPANY_SUSPENDED" : "COMPANY_UNSUSPENDED",
      targetType: "company",
      targetId: parsed.data.id,
      summary: parsed.data.suspend ? "Company suspended from posting." : "Company suspension removed.",
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/companies");
  revalidatePath("/me/companies");
  revalidatePath("/me/jobs");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function toggleCompanyVerification(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/companies";

  const parsed = companyVerificationSchema.safeParse({
    id: formData.get("id"),
    verify: formData.get("verify") === "1",
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    await prisma.company.update({
      where: { id: parsed.data.id },
      data: {
        verificationStatus: parsed.data.verify ? "VERIFIED" : "PENDING_VERIFICATION",
        verifiedAt: parsed.data.verify ? new Date() : null,
      },
    });
    await writeAdminAuditLog({
      adminId: session.user.id,
      action: parsed.data.verify ? "COMPANY_VERIFIED" : "COMPANY_UNVERIFIED",
      targetType: "company",
      targetId: parsed.data.id,
      summary: parsed.data.verify ? "Company verified for posting." : "Company verification removed.",
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/companies");
  revalidatePath("/me/companies");
  revalidatePath("/me/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const fallbackPath = "/admin/categories";

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
      },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/categories");
  redirectAdminSuccess(fallbackPath);
}

export async function deleteCategory(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/categories";
  const id = formData.get("id");

  if (typeof id !== "string") {
    redirectAdminError(fallbackPath);
  }

  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    });
    if (!category) {
      redirectAdminError(fallbackPath);
    }

    await prisma.$transaction([
      prisma.deletedCategory.upsert({
        where: { originalId: category.id },
        create: {
          originalId: category.id,
          payloadJson: JSON.stringify(category),
          deletedById: session.user.id,
        },
        update: {
          payloadJson: JSON.stringify(category),
          deletedById: session.user.id,
          deletedAt: new Date(),
          restoredAt: null,
          restoredById: null,
        },
      }),
      prisma.category.delete({ where: { id } }),
    ]);
    await logAdminChange({
      adminId: session.user.id,
      entityType: "category",
      entityId: category.id,
      action: "soft_delete",
      before: category,
      after: null,
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/trash");
  redirectAdminSuccess(fallbackPath);
}

export async function clearErrorLogs(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/errors";
  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);

  try {
    const countBefore = await prisma.errorLog.count();
    await prisma.errorLog.deleteMany({});
    await logAdminChange({
      adminId: session.user.id,
      entityType: "error_log",
      action: "bulk_delete",
      before: { count: countBefore },
      after: { count: 0 },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/errors");
  redirectAdminSuccess(fallbackPath);
}

export async function approveCategorySuggestion(formData: FormData) {
  await requireAdmin();
  const fallbackPath = "/admin/categories";

  const parsed = categorySuggestionModerationSchema.safeParse({
    id: formData.get("id"),
    adminNote: formData.get("adminNote"),
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  const suggestion = await prisma.categorySuggestion.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true, name: true, normalizedName: true },
  });

  if (!suggestion || suggestion.status !== "PENDING") {
    redirectAdminError(fallbackPath);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const slug = slugify(suggestion.name);
      const existing = await tx.category.findUnique({ where: { slug }, select: { id: true } });

      if (!existing) {
        await tx.category.create({
          data: {
            name: suggestion.name,
            slug,
          },
        });
      }

      await tx.categorySuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: "APPROVED",
          adminNote: parsed.data.adminNote?.trim() || null,
          reviewedAt: new Date(),
        },
      });
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  revalidatePath("/me/companies");
  revalidatePath("/me/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function rejectCategorySuggestion(formData: FormData) {
  await requireAdmin();
  const fallbackPath = "/admin/categories";

  const parsed = categorySuggestionModerationSchema.safeParse({
    id: formData.get("id"),
    adminNote: formData.get("adminNote"),
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    await prisma.categorySuggestion.update({
      where: { id: parsed.data.id },
      data: {
        status: "REJECTED",
        adminNote: parsed.data.adminNote?.trim() || null,
        reviewedAt: new Date(),
      },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  revalidatePath("/me/companies");
  redirectAdminSuccess(fallbackPath);
}

export async function createJob(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/jobs";
  const parsed = parseJobPayload(formData, fallbackPath);
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { minJobDescriptionLength: true, blockedKeywords: true },
  });

  const sanitizedSummary = sanitizeRichText(parsed.summary);
  const sanitizedDescription = sanitizeRichText(parsed.description);
  const plainSummary = stripRichText(sanitizedSummary);
  const plainDescription = stripRichText(sanitizedDescription);

  if (plainSummary.length < 10 || plainDescription.length < (settings?.minJobDescriptionLength ?? 20)) {
    redirectAdminError(fallbackPath);
  }

  const blockedKeywords = (settings?.blockedKeywords || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (blockedKeywords.length) {
    const haystack = `${parsed.title} ${plainSummary} ${plainDescription}`.toLowerCase();
    if (blockedKeywords.some((keyword) => haystack.includes(keyword))) {
      redirectAdminError(fallbackPath);
    }
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: parsed.companyId },
      select: { isSuspended: true, verificationStatus: true },
    });

    if (!company || company.isSuspended || company.verificationStatus !== "VERIFIED") {
      redirectAdminError(fallbackPath);
    }

    const created = await prisma.job.create({
      data: {
        title: parsed.title,
        slug: `${slugify(parsed.title)}-${Date.now()}`,
        summary: sanitizedSummary,
        description: sanitizedDescription,
        location: parsed.location,
        companyId: parsed.companyId,
        categoryId: parsed.categoryId || null,
        employmentType: parsed.employmentType,
        status: parsed.status,
        isRemote: parsed.isRemote,
        salaryMin: parsed.salaryMin,
        salaryMax: parsed.salaryMax,
        currency: parsed.currency,
        expirationDate: parsed.expirationDate ?? defaultExpirationDate(),
        referenceNumber: buildReferenceNumber(),
        publishedAt: parsed.status === JobStatus.PUBLISHED ? new Date() : null,
        createdById: session.user.id,
      },
    });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "job",
      entityId: created.id,
      action: "create",
      after: { id: created.id, title: created.title, status: created.status, companyId: created.companyId },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function updateJob(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id");

  if (typeof id !== "string") {
    redirectAdminError("/admin/jobs");
  }

  const fallbackPath = `/admin/jobs/${id}`;
  const parsed = parseJobPayload(formData, fallbackPath);
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { minJobDescriptionLength: true, blockedKeywords: true },
  });

  const sanitizedSummary = sanitizeRichText(parsed.summary);
  const sanitizedDescription = sanitizeRichText(parsed.description);
  const plainSummary = stripRichText(sanitizedSummary);
  const plainDescription = stripRichText(sanitizedDescription);

  if (plainSummary.length < 10 || plainDescription.length < (settings?.minJobDescriptionLength ?? 20)) {
    redirectAdminError(fallbackPath);
  }

  const blockedKeywords = (settings?.blockedKeywords || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (blockedKeywords.length) {
    const haystack = `${parsed.title} ${plainSummary} ${plainDescription}`.toLowerCase();
    if (blockedKeywords.some((keyword) => haystack.includes(keyword))) {
      redirectAdminError(fallbackPath);
    }
  }
  const existing = await prisma.job.findUnique({
    where: { id },
    select: { referenceNumber: true },
  });

  if (!existing) {
    redirectAdminError("/admin/jobs");
  }

  try {
    const before = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        companyId: true,
        categoryId: true,
        salaryMin: true,
        salaryMax: true,
      },
    });
    const company = await prisma.company.findUnique({
      where: { id: parsed.companyId },
      select: { isSuspended: true, verificationStatus: true },
    });

    if (!company || company.isSuspended || company.verificationStatus !== "VERIFIED") {
      redirectAdminError(fallbackPath);
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        title: parsed.title,
        summary: sanitizedSummary,
        description: sanitizedDescription,
        location: parsed.location,
        companyId: parsed.companyId,
        categoryId: parsed.categoryId || null,
        employmentType: parsed.employmentType,
        status: parsed.status,
        isRemote: parsed.isRemote,
        salaryMin: parsed.salaryMin,
        salaryMax: parsed.salaryMax,
        currency: parsed.currency,
        expirationDate: parsed.expirationDate ?? defaultExpirationDate(),
        referenceNumber: existing.referenceNumber ?? buildReferenceNumber(),
        publishedAt: parsed.status === JobStatus.PUBLISHED ? new Date() : null,
      },
    });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "job",
      entityId: id,
      action: "update",
      before,
      after: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        companyId: updated.companyId,
        categoryId: updated.categoryId,
        salaryMin: updated.salaryMin,
        salaryMax: updated.salaryMax,
      },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/jobs");
  revalidatePath(fallbackPath);
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function deleteJob(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/jobs";
  const id = formData.get("id");

  if (typeof id !== "string") {
    redirectAdminError(fallbackPath);
  }

  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: { select: { name: true } },
        category: { select: { name: true } },
        createdBy: { select: { email: true, name: true, accountType: true } },
        _count: { select: { applications: true, savedBy: true } },
      },
    });
    if (!job) {
      redirectAdminError(fallbackPath);
    }

    await prisma.$transaction([
      prisma.deletedJob.upsert({
        where: { originalId: job.id },
        create: {
          originalId: job.id,
          payloadJson: JSON.stringify(job),
          deletedById: session.user.id,
        },
        update: {
          payloadJson: JSON.stringify(job),
          deletedById: session.user.id,
          deletedAt: new Date(),
          restoredAt: null,
          restoredById: null,
        },
      }),
      prisma.job.delete({ where: { id } }),
    ]);
    await logAdminChange({
      adminId: session.user.id,
      entityType: "job",
      entityId: job.id,
      action: "soft_delete",
      before: job,
      after: null,
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/trash");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function approvePendingJob(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/jobs";

  const parsed = moderationSchema.safeParse({
    id: formData.get("id"),
    moderationNote: formData.get("moderationNote"),
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  const existing = await prisma.job.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true, title: true, referenceNumber: true, createdBy: { select: { email: true, name: true, preferredLocale: true } } },
  });

  if (!existing || existing.status !== "PENDING_REVIEW") {
    redirectAdminError(fallbackPath);
  }

  await prisma.job.update({
    where: { id: existing.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      moderationNote: parsed.data.moderationNote || null,
    },
  });
  await writeAdminAuditLog({
    adminId: session.user.id,
    action: "JOB_APPROVED",
    targetType: "job",
    targetId: existing.id,
    summary: parsed.data.moderationNote || "Approved from pending review.",
  });
  await logAdminChange({
    adminId: session.user.id,
    entityType: "job",
    entityId: existing.id,
    action: "approve",
    before: { status: existing.status },
    after: { status: "PUBLISHED", moderationNote: parsed.data.moderationNote || null },
  });

  try {
    const ownerLocale = existing.createdBy.preferredLocale || "en";
    const isRo = ownerLocale === "ro";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendTemplatedEmail({
      to: existing.createdBy.email,
      templateKey: "JOB_REVIEW_DECISION",
      locale: ownerLocale,
      variables: {
        name: existing.createdBy.name || "Owner",
        jobTitle: existing.title,
        decision: isRo ? "Aprobat" : "Approved",
        referenceNumber: existing.referenceNumber || "-",
        moderationNote: parsed.data.moderationNote || (isRo ? "Fara nota." : "No note."),
        manageUrl: `${baseUrl.replace(/\/$/, "")}/me/employer/jobs`,
      },
    });
  } catch {
    // Do not block moderation flow if email fails.
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/me/jobs");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function rejectPendingJob(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/jobs";

  const parsed = moderationSchema.safeParse({
    id: formData.get("id"),
    moderationNote: formData.get("moderationNote"),
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  const existing = await prisma.job.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true, title: true, referenceNumber: true, createdBy: { select: { email: true, name: true, preferredLocale: true } } },
  });

  if (!existing || existing.status !== "PENDING_REVIEW") {
    redirectAdminError(fallbackPath);
  }

  await prisma.job.update({
    where: { id: existing.id },
    data: {
      status: "DRAFT",
      publishedAt: null,
      moderationNote: parsed.data.moderationNote || null,
    },
  });
  await writeAdminAuditLog({
    adminId: session.user.id,
    action: "JOB_REJECTED",
    targetType: "job",
    targetId: existing.id,
    summary: parsed.data.moderationNote || "Rejected to draft.",
  });
  await logAdminChange({
    adminId: session.user.id,
    entityType: "job",
    entityId: existing.id,
    action: "reject_to_draft",
    before: { status: existing.status },
    after: { status: "DRAFT", moderationNote: parsed.data.moderationNote || null },
  });

  try {
    const ownerLocale = existing.createdBy.preferredLocale || "en";
    const isRo = ownerLocale === "ro";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendTemplatedEmail({
      to: existing.createdBy.email,
      templateKey: "JOB_REVIEW_DECISION",
      locale: ownerLocale,
      variables: {
        name: existing.createdBy.name || "Owner",
        jobTitle: existing.title,
        decision: isRo ? "Respins (in draft)" : "Rejected (moved to draft)",
        referenceNumber: existing.referenceNumber || "-",
        moderationNote: parsed.data.moderationNote || (isRo ? "Fara nota." : "No note."),
        manageUrl: `${baseUrl.replace(/\/$/, "")}/me/employer/jobs`,
      },
    });
  } catch {
    // Do not block moderation flow if email fails.
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/me/jobs");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function updateApplicationStatus(formData: FormData) {
  await requireAdmin();
  const fallbackPath = "/admin/applications";
  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || typeof status !== "string") {
    redirectAdminError(fallbackPath);
  }

  if (!Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
    redirectAdminError(fallbackPath);
  }

  try {
    await prisma.application.update({
      where: { id },
      data: { status: status as ApplicationStatus },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/applications");
  redirectAdminSuccess(fallbackPath);
}

export async function createAdminUser(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/users";

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    const accountType =
      parsed.data.role === UserRole.EMPLOYER
        ? "employer"
        : parsed.data.role === UserRole.CANDIDATE
          ? "candidate"
          : "candidate";
    const created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        role: parsed.data.role,
        accountType,
      },
    });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "user",
      entityId: created.id,
      action: "create",
      after: { id: created.id, email: created.email, role: created.role, accountType: created.accountType },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/users");
  redirectAdminSuccess(fallbackPath);
}

export async function updateUserRole(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/users";
  const id = formData.get("id");
  const role = formData.get("role");

  if (typeof id !== "string" || typeof role !== "string") {
    redirectAdminError(fallbackPath);
  }

  if (!Object.values(UserRole).includes(role as UserRole)) {
    redirectAdminError(fallbackPath);
  }

  const nextRole = role as UserRole;
  const nextAccountType =
    nextRole === UserRole.EMPLOYER ? "employer" : nextRole === UserRole.CANDIDATE ? "candidate" : null;

  try {
    const before = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, accountType: true, email: true },
    });
    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: nextRole,
        ...(nextAccountType ? { accountType: nextAccountType } : {}),
      },
    });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "user",
      entityId: updated.id,
      action: "role_update",
      before,
      after: { id: updated.id, role: updated.role, accountType: updated.accountType, email: updated.email },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/users");
  revalidatePath("/me");
  revalidatePath("/me/candidate");
  revalidatePath("/me/employer");
  redirectAdminSuccess(fallbackPath);
}

export async function updateSiteSettings(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/settings";
  const previousSettings = await prisma.siteSettings.findUnique({ where: { id: "default" } });

  const parsed = siteSettingsSchema.safeParse({
    siteName: formData.get("siteName"),
    defaultLocale: String(formData.get("defaultLocale") || "ro").toLowerCase(),
    siteTagline: formData.get("siteTagline"),
    supportEmail: formData.get("supportEmail"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    defaultCurrency: String(formData.get("defaultCurrency") || "EUR").toUpperCase(),
    defaultJobExpirationDays: formData.get("defaultJobExpirationDays"),
    jobsPerPage: formData.get("jobsPerPage"),
    adminDashboardDefaultRange: formData.get("adminDashboardDefaultRange") || "7d",
    homeFeaturedJobsCount: formData.get("homeFeaturedJobsCount") || 8,
    jobsDefaultPostedFilter: formData.get("jobsDefaultPostedFilter") || "any",
    maintenanceScope: formData.get("maintenanceScope") || "PUBLIC_ONLY",
    loginRateLimitPerHour: formData.get("loginRateLimitPerHour") || 20,
    registerRateLimitPerHour: formData.get("registerRateLimitPerHour") || 10,
    applyRateLimitPerHour: formData.get("applyRateLimitPerHour") || 25,
    requireCvOnApply: formData.get("requireCvOnApply") === "on",
    minApplicationMessageLength: formData.get("minApplicationMessageLength") || 0,
    preventDuplicateApplications: formData.get("preventDuplicateApplications") === "on",
    blockedKeywords: formData.get("blockedKeywords"),
    minJobDescriptionLength: formData.get("minJobDescriptionLength") || 20,
    allowCandidatePosting: formData.get("allowCandidatePosting") === "on",
    allowPublicRegistration: formData.get("allowPublicRegistration") === "on",
    requireCompanyBeforePosting: formData.get("requireCompanyBeforePosting") === "on",
    autoApproveCandidateJobs: formData.get("autoApproveCandidateJobs") === "on",
    maintenanceMode: formData.get("maintenanceMode") === "on",
    maintenanceMessage: formData.get("maintenanceMessage"),
    seoNoIndex: formData.get("seoNoIndex") === "on",
    seoCanonicalUrl: formData.get("seoCanonicalUrl"),
    seoDefaultOgImage: formData.get("seoDefaultOgImage"),
    siteFaviconUrl: formData.get("siteFaviconUrl"),
    enableSitemap: formData.get("enableSitemap") === "on",
    gaMeasurementId: formData.get("gaMeasurementId"),
    smtpHost: formData.get("smtpHost"),
    smtpPort: formData.get("smtpPort") || undefined,
    smtpUser: formData.get("smtpUser"),
    smtpPassword: formData.get("smtpPassword"),
    smtpFrom: formData.get("smtpFrom"),
    smtpSecure: formData.get("smtpSecure") === "on",
    adminSessionMaxHours: formData.get("adminSessionMaxHours") || 12,
    maxFailedLogins: formData.get("maxFailedLogins") || 10,
    adminTwoFactorRequired: formData.get("adminTwoFactorRequired") === "on",
    maxUploadMb: formData.get("maxUploadMb") || 10,
    allowedMimeTypes: formData.get("allowedMimeTypes"),
    defaultTimezone: formData.get("defaultTimezone") || "Europe/Bucharest",
    dateFormat: formData.get("dateFormat") || "dd.MM.yyyy",
    allowedCountries: formData.get("allowedCountries"),
    webhookUrl: formData.get("webhookUrl"),
    webhookSecret: formData.get("webhookSecret"),
    featureSavedJobs: formData.get("featureSavedJobs") === "on",
    featureResumeBuilder: formData.get("featureResumeBuilder") === "on",
    featurePublicProfiles: formData.get("featurePublicProfiles") === "on",
    autoCloseExpiredJobs: formData.get("autoCloseExpiredJobs") === "on",
    applicationRetentionDays: formData.get("applicationRetentionDays") || 365,
    draftRetentionDays: formData.get("draftRetentionDays") || 90,
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    if (previousSettings) {
      await prisma.siteSettingsVersion.create({
        data: {
          settingsJson: JSON.stringify(previousSettings),
          reason: "before_update",
        },
      }).catch(() => null);
    }

    const updatedSettings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        siteName: parsed.data.siteName,
        defaultLocale: parsed.data.defaultLocale,
        siteTagline: parsed.data.siteTagline || null,
        supportEmail: parsed.data.supportEmail || null,
        contactEmail: parsed.data.contactEmail || null,
        contactPhone: parsed.data.contactPhone || null,
        defaultCurrency: parsed.data.defaultCurrency,
        defaultJobExpirationDays: parsed.data.defaultJobExpirationDays,
        jobsPerPage: parsed.data.jobsPerPage,
        adminDashboardDefaultRange: parsed.data.adminDashboardDefaultRange,
        homeFeaturedJobsCount: parsed.data.homeFeaturedJobsCount,
        jobsDefaultPostedFilter: parsed.data.jobsDefaultPostedFilter,
        maintenanceScope: parsed.data.maintenanceScope,
        loginRateLimitPerHour: parsed.data.loginRateLimitPerHour,
        registerRateLimitPerHour: parsed.data.registerRateLimitPerHour,
        applyRateLimitPerHour: parsed.data.applyRateLimitPerHour,
        requireCvOnApply: parsed.data.requireCvOnApply,
        minApplicationMessageLength: parsed.data.minApplicationMessageLength,
        preventDuplicateApplications: parsed.data.preventDuplicateApplications,
        blockedKeywords: parsed.data.blockedKeywords || null,
        minJobDescriptionLength: parsed.data.minJobDescriptionLength,
        allowCandidatePosting: parsed.data.allowCandidatePosting,
        allowPublicRegistration: parsed.data.allowPublicRegistration,
        requireCompanyBeforePosting: parsed.data.requireCompanyBeforePosting,
        autoApproveCandidateJobs: parsed.data.autoApproveCandidateJobs,
        maintenanceMode: parsed.data.maintenanceMode,
        maintenanceMessage: parsed.data.maintenanceMessage || null,
        seoNoIndex: parsed.data.seoNoIndex,
        seoCanonicalUrl: parsed.data.seoCanonicalUrl || null,
        seoDefaultOgImage: parsed.data.seoDefaultOgImage || null,
        siteFaviconUrl: parsed.data.siteFaviconUrl || null,
        enableSitemap: parsed.data.enableSitemap,
        gaMeasurementId: parsed.data.gaMeasurementId || null,
        smtpHost: parsed.data.smtpHost || null,
        smtpPort: parsed.data.smtpPort || null,
        smtpUser: parsed.data.smtpUser || null,
        smtpPassword: parsed.data.smtpPassword || null,
        smtpFrom: parsed.data.smtpFrom || null,
        smtpSecure: parsed.data.smtpSecure,
        adminSessionMaxHours: parsed.data.adminSessionMaxHours,
        maxFailedLogins: parsed.data.maxFailedLogins,
        adminTwoFactorRequired: parsed.data.adminTwoFactorRequired,
        maxUploadMb: parsed.data.maxUploadMb,
        allowedMimeTypes: parsed.data.allowedMimeTypes || null,
        defaultTimezone: parsed.data.defaultTimezone,
        dateFormat: parsed.data.dateFormat,
        allowedCountries: parsed.data.allowedCountries || null,
        webhookUrl: parsed.data.webhookUrl || null,
        webhookSecret: parsed.data.webhookSecret || null,
        featureSavedJobs: parsed.data.featureSavedJobs,
        featureResumeBuilder: parsed.data.featureResumeBuilder,
        featurePublicProfiles: parsed.data.featurePublicProfiles,
        autoCloseExpiredJobs: parsed.data.autoCloseExpiredJobs,
        applicationRetentionDays: parsed.data.applicationRetentionDays,
        draftRetentionDays: parsed.data.draftRetentionDays,
      },
      update: {
        siteName: parsed.data.siteName,
        defaultLocale: parsed.data.defaultLocale,
        siteTagline: parsed.data.siteTagline || null,
        supportEmail: parsed.data.supportEmail || null,
        contactEmail: parsed.data.contactEmail || null,
        contactPhone: parsed.data.contactPhone || null,
        defaultCurrency: parsed.data.defaultCurrency,
        defaultJobExpirationDays: parsed.data.defaultJobExpirationDays,
        jobsPerPage: parsed.data.jobsPerPage,
        adminDashboardDefaultRange: parsed.data.adminDashboardDefaultRange,
        homeFeaturedJobsCount: parsed.data.homeFeaturedJobsCount,
        jobsDefaultPostedFilter: parsed.data.jobsDefaultPostedFilter,
        maintenanceScope: parsed.data.maintenanceScope,
        loginRateLimitPerHour: parsed.data.loginRateLimitPerHour,
        registerRateLimitPerHour: parsed.data.registerRateLimitPerHour,
        applyRateLimitPerHour: parsed.data.applyRateLimitPerHour,
        requireCvOnApply: parsed.data.requireCvOnApply,
        minApplicationMessageLength: parsed.data.minApplicationMessageLength,
        preventDuplicateApplications: parsed.data.preventDuplicateApplications,
        blockedKeywords: parsed.data.blockedKeywords || null,
        minJobDescriptionLength: parsed.data.minJobDescriptionLength,
        allowCandidatePosting: parsed.data.allowCandidatePosting,
        allowPublicRegistration: parsed.data.allowPublicRegistration,
        requireCompanyBeforePosting: parsed.data.requireCompanyBeforePosting,
        autoApproveCandidateJobs: parsed.data.autoApproveCandidateJobs,
        maintenanceMode: parsed.data.maintenanceMode,
        maintenanceMessage: parsed.data.maintenanceMessage || null,
        seoNoIndex: parsed.data.seoNoIndex,
        seoCanonicalUrl: parsed.data.seoCanonicalUrl || null,
        seoDefaultOgImage: parsed.data.seoDefaultOgImage || null,
        siteFaviconUrl: parsed.data.siteFaviconUrl || null,
        enableSitemap: parsed.data.enableSitemap,
        gaMeasurementId: parsed.data.gaMeasurementId || null,
        smtpHost: parsed.data.smtpHost || null,
        smtpPort: parsed.data.smtpPort || null,
        smtpUser: parsed.data.smtpUser || null,
        smtpPassword: parsed.data.smtpPassword || null,
        smtpFrom: parsed.data.smtpFrom || null,
        smtpSecure: parsed.data.smtpSecure,
        adminSessionMaxHours: parsed.data.adminSessionMaxHours,
        maxFailedLogins: parsed.data.maxFailedLogins,
        adminTwoFactorRequired: parsed.data.adminTwoFactorRequired,
        maxUploadMb: parsed.data.maxUploadMb,
        allowedMimeTypes: parsed.data.allowedMimeTypes || null,
        defaultTimezone: parsed.data.defaultTimezone,
        dateFormat: parsed.data.dateFormat,
        allowedCountries: parsed.data.allowedCountries || null,
        webhookUrl: parsed.data.webhookUrl || null,
        webhookSecret: parsed.data.webhookSecret || null,
        featureSavedJobs: parsed.data.featureSavedJobs,
        featureResumeBuilder: parsed.data.featureResumeBuilder,
        featurePublicProfiles: parsed.data.featurePublicProfiles,
        autoCloseExpiredJobs: parsed.data.autoCloseExpiredJobs,
        applicationRetentionDays: parsed.data.applicationRetentionDays,
        draftRetentionDays: parsed.data.draftRetentionDays,
      } as Prisma.SiteSettingsUncheckedUpdateInput,
    });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "site_settings",
      entityId: "default",
      action: "update",
      before: previousSettings,
      after: updatedSettings,
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/me/jobs");
  revalidatePath("/jobs");
  revalidatePath("/register");
  revalidatePath("/");
  redirectAdminSuccess(fallbackPath);
}

const translationEntrySchema = z.object({
  locale: z.enum(LOCALE_CODES),
  key: z.string().min(1).max(240),
  value: z.string().max(5000).optional().or(z.literal("")),
});

const mediaAssetSchema = z.object({
  url: z.string().min(1),
  label: z.string().max(120).optional().or(z.literal("")),
  mimeType: z.string().max(120).optional().or(z.literal("")),
  sizeBytes: z.coerce.number().int().nonnegative().optional(),
  kind: z.string().max(30).optional().or(z.literal("")),
});

const emailTemplateSchema = z.object({
  key: z.string().min(1).max(80),
  locale: z.enum(LOCALE_CODES),
  subject: z.string().min(1).max(240),
  textBody: z.string().min(1).max(12000),
  htmlBody: z.string().max(40000).optional().or(z.literal("")),
  isEnabled: z.boolean(),
});

const smtpTestSchema = z.object({
  email: z.string().email(),
});

export async function updateTranslationsBulk(formData: FormData) {
  await requireAdmin();
  const fallbackPath = "/admin/settings/translations";

  const entries: Array<{ locale: "ro" | "en"; key: string; value: string }> = [];

  for (const [name, rawValue] of formData.entries()) {
    if (!name.startsWith("tr__")) {
      continue;
    }
    const parts = name.split("__");
    const locale = parts[1];
    const key = parts.slice(2).join("__");
    if (typeof rawValue !== "string") {
      continue;
    }
    const parsed = translationEntrySchema.safeParse({
      locale,
      key,
      value: rawValue.trim(),
    });
    if (!parsed.success) {
      continue;
    }
    entries.push({
      locale: parsed.data.locale,
      key: parsed.data.key,
      value: parsed.data.value || "",
    });
  }

  try {
    const existing = await prisma.localeTranslation.findMany({
      where: { locale: { in: [...LOCALE_CODES] } },
      select: { locale: true, key: true, value: true },
    });
    const existingMap = new Map(existing.map((item) => [`${item.locale}::${item.key}`, item.value]));

    const operations = [];
    for (const entry of entries) {
      const mapKey = `${entry.locale}::${entry.key}`;
      const prevValue = existingMap.get(mapKey) || "";
      const nextValue = entry.value.trim();

      if (nextValue === prevValue) {
        continue;
      }

      if (!nextValue) {
        operations.push(
          prisma.localeTranslation.deleteMany({
            where: { locale: entry.locale, key: entry.key },
          })
        );
      } else {
        operations.push(
          prisma.localeTranslation.upsert({
            where: { locale_key: { locale: entry.locale, key: entry.key } },
            create: { locale: entry.locale, key: entry.key, value: nextValue },
            update: { value: nextValue },
          })
        );
      }
    }

    if (operations.length) {
      await prisma.$transaction(operations);
    }
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/translations");
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/me");
  redirectAdminSuccess(fallbackPath);
}

export async function createMediaAsset(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/settings/media";
  const parsed = mediaAssetSchema.safeParse({
    url: formData.get("url"),
    label: formData.get("label"),
    mimeType: formData.get("mimeType"),
    sizeBytes: formData.get("sizeBytes") || undefined,
    kind: formData.get("kind") || "image",
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    await prisma.mediaAsset.upsert({
      where: { url: parsed.data.url },
      create: {
        url: parsed.data.url,
        label: parsed.data.label || null,
        mimeType: parsed.data.mimeType || null,
        sizeBytes: parsed.data.sizeBytes || null,
        kind: parsed.data.kind || "image",
        uploadedById: session.user.id,
      },
      update: {
        label: parsed.data.label || null,
        mimeType: parsed.data.mimeType || null,
        sizeBytes: parsed.data.sizeBytes || null,
        kind: parsed.data.kind || "image",
      },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/settings/media");
  revalidatePath("/admin/settings");
  redirectAdminSuccess(fallbackPath);
}

export async function deleteMediaAsset(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/settings/media";
  const id = formData.get("id");
  if (typeof id !== "string") {
    redirectAdminError(fallbackPath);
  }
  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);

  try {
    await prisma.mediaAsset.delete({ where: { id } });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "media_asset",
      entityId: id,
      action: "delete",
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/settings/media");
  revalidatePath("/admin/settings");
  redirectAdminSuccess(fallbackPath);
}

export async function rollbackSiteSettingsVersion(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/settings?tab=operations";
  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);
  const versionId = formData.get("versionId");

  if (typeof versionId !== "string" || !versionId) {
    redirectAdminError(fallbackPath);
  }

  try {
    const version = await prisma.siteSettingsVersion.findUnique({
      where: { id: versionId },
      select: { settingsJson: true },
    });
    if (!version) {
      redirectAdminError(fallbackPath);
    }

    const parsed = JSON.parse(version.settingsJson) as Record<string, unknown>;
    const restorePayload = toSiteSettingsPersistable(parsed);

    await prisma.siteSettingsVersion.create({
      data: {
        settingsJson: JSON.stringify(await prisma.siteSettings.findUnique({ where: { id: "default" } })),
        createdById: session.user.id,
        reason: "before_rollback",
        restoredFromId: versionId,
      },
    });

    const updated = await prisma.siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...(restorePayload as Prisma.SiteSettingsUncheckedCreateInput),
      },
      update: restorePayload,
    });

    await logAdminChange({
      adminId: session.user.id,
      entityType: "site_settings",
      entityId: "default",
      action: "rollback",
      before: null,
      after: updated,
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function restoreDeletedJob(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/trash";
  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);
  const deletedId = formData.get("deletedId");

  if (typeof deletedId !== "string" || !deletedId) {
    redirectAdminError(fallbackPath);
  }

  try {
    const deleted = await prisma.deletedJob.findUnique({ where: { id: deletedId } });
    if (!deleted || deleted.restoredAt) {
      redirectAdminError(fallbackPath);
    }
    const payload = JSON.parse(deleted.payloadJson) as Record<string, unknown>;

    await prisma.job.create({
      data: {
        id: String(payload.id),
        title: String(payload.title),
        slug: String(payload.slug),
        summary: String(payload.summary),
        description: String(payload.description),
        location: String(payload.location),
        isRemote: Boolean(payload.isRemote),
        employmentType: payload.employmentType as EmploymentType,
        salaryMin: typeof payload.salaryMin === "number" ? payload.salaryMin : null,
        salaryMax: typeof payload.salaryMax === "number" ? payload.salaryMax : null,
        viewsCount: typeof payload.viewsCount === "number" ? payload.viewsCount : 0,
        currency: String(payload.currency || "EUR"),
        expirationDate: payload.expirationDate ? new Date(String(payload.expirationDate)) : null,
        referenceNumber: payload.referenceNumber ? String(payload.referenceNumber) : null,
        status: payload.status as JobStatus,
        moderationNote: payload.moderationNote ? String(payload.moderationNote) : null,
        publishedAt: payload.publishedAt ? new Date(String(payload.publishedAt)) : null,
        companyId: String(payload.companyId),
        categoryId: payload.categoryId ? String(payload.categoryId) : null,
        createdById: String(payload.createdById),
      },
    });

    await prisma.deletedJob.update({
      where: { id: deleted.id },
      data: { restoredAt: new Date(), restoredById: session.user.id },
    });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "job",
      entityId: String(payload.id),
      action: "restore",
      after: payload,
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/trash");
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function restoreDeletedCategory(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/trash";
  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);
  const deletedId = formData.get("deletedId");

  if (typeof deletedId !== "string" || !deletedId) {
    redirectAdminError(fallbackPath);
  }

  try {
    const deleted = await prisma.deletedCategory.findUnique({ where: { id: deletedId } });
    if (!deleted || deleted.restoredAt) {
      redirectAdminError(fallbackPath);
    }
    const payload = JSON.parse(deleted.payloadJson) as Record<string, unknown>;
    await prisma.category.create({
      data: {
        id: String(payload.id),
        name: String(payload.name),
        slug: String(payload.slug),
      },
    });
    await prisma.deletedCategory.update({
      where: { id: deleted.id },
      data: { restoredAt: new Date(), restoredById: session.user.id },
    });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "category",
      entityId: String(payload.id),
      action: "restore",
      after: payload,
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/trash");
  revalidatePath("/admin/categories");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function restoreDeletedCompany(formData: FormData) {
  const session = await requireAdmin();
  const fallbackPath = "/admin/trash";
  await requireDestructiveConfirmation(formData, session.user.id, fallbackPath);
  const deletedId = formData.get("deletedId");

  if (typeof deletedId !== "string" || !deletedId) {
    redirectAdminError(fallbackPath);
  }

  try {
    const deleted = await prisma.deletedCompany.findUnique({ where: { id: deletedId } });
    if (!deleted || deleted.restoredAt) {
      redirectAdminError(fallbackPath);
    }
    const payload = JSON.parse(deleted.payloadJson) as Record<string, unknown>;
    await prisma.company.create({
      data: {
        id: String(payload.id),
        name: String(payload.name),
        slug: String(payload.slug),
        logoUrl: payload.logoUrl ? String(payload.logoUrl) : null,
        registrationNumber: payload.registrationNumber ? String(payload.registrationNumber) : null,
        vatNumber: payload.vatNumber ? String(payload.vatNumber) : null,
        industry: payload.industry ? String(payload.industry) : null,
        companySize: payload.companySize ? String(payload.companySize) : null,
        foundedYear: typeof payload.foundedYear === "number" ? payload.foundedYear : null,
        isSuspended: Boolean(payload.isSuspended),
        verificationStatus: payload.verificationStatus as "PENDING_VERIFICATION" | "VERIFIED",
        verifiedAt: payload.verifiedAt ? new Date(String(payload.verifiedAt)) : null,
        location: String(payload.location),
        website: payload.website ? String(payload.website) : null,
        description: payload.description ? String(payload.description) : null,
        ownerId: payload.ownerId ? String(payload.ownerId) : null,
      },
    });
    await prisma.deletedCompany.update({
      where: { id: deleted.id },
      data: { restoredAt: new Date(), restoredById: session.user.id },
    });
    await logAdminChange({
      adminId: session.user.id,
      entityType: "company",
      entityId: String(payload.id),
      action: "restore",
      after: payload,
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/trash");
  revalidatePath("/admin/companies");
  revalidatePath("/jobs");
  redirectAdminSuccess(fallbackPath);
}

export async function saveEmailTemplate(formData: FormData) {
  await requireAdmin();
  const rawKey = formData.get("key");
  const rawLocale = formData.get("locale");
  const fallbackPath =
    typeof rawKey === "string" && rawKey.trim().length > 0
      ? `/admin/settings/email-templates?tpl=${encodeURIComponent(rawKey)}${typeof rawLocale === "string" ? `&lang=${encodeURIComponent(rawLocale)}` : ""}`
      : "/admin/settings/email-templates";
  const parsed = emailTemplateSchema.safeParse({
    key: formData.get("key"),
    locale: formData.get("locale"),
    subject: formData.get("subject"),
    textBody: formData.get("textBody"),
    htmlBody: formData.get("htmlBody"),
    isEnabled: formData.get("isEnabled") === "on",
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    await prisma.emailTemplate.upsert({
      where: { key_locale: { key: parsed.data.key, locale: parsed.data.locale } },
      create: {
        key: parsed.data.key,
        locale: parsed.data.locale,
        subject: parsed.data.subject,
        textBody: parsed.data.textBody,
        htmlBody: parsed.data.htmlBody || null,
        isEnabled: parsed.data.isEnabled,
      },
      update: {
        subject: parsed.data.subject,
        textBody: parsed.data.textBody,
        htmlBody: parsed.data.htmlBody || null,
        isEnabled: parsed.data.isEnabled,
      },
    });
  } catch {
    redirectAdminError(fallbackPath);
  }

  revalidatePath("/admin/settings/email-templates");
  redirectAdminSuccess(fallbackPath);
}

export async function sendSmtpTestEmail(formData: FormData) {
  await requireAdmin();
  const fallbackPath = "/admin/settings?tab=integrations";
  const parsed = smtpTestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirectAdminError(fallbackPath);
  }

  try {
    const sent = await sendEmail({
      to: parsed.data.email,
      subject: "NextJobs SMTP test",
      text: "SMTP test email sent successfully.",
      html: "<p><strong>SMTP test email sent successfully.</strong></p>",
    });

    if (!sent) {
      redirectAdminError(fallbackPath);
    }
  } catch {
    redirectAdminError(fallbackPath);
  }

  redirectAdminSuccess(fallbackPath);
}
