"use server";

import { EmploymentType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { CURRENCY_CODES } from "@/lib/currencies";
import { prisma } from "@/lib/db";
import { sendTemplatedEmail } from "@/lib/email";
import { sanitizeRichText, stripRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/utils";
import { sendWebhookEvent } from "@/lib/webhooks";

function withToast(path: string, toast: "resume_saved" | "admin_error" | "admin_success") {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("toast", toast);
  return `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
}

async function requireUser() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?callbackUrl=/me");
  }

  return session;
}

async function requireEmployerUser() {
  const session = await requireUser();
  if (session.user.accountType !== "employer") {
    redirect(withToast("/me", "admin_error"));
  }
  return session;
}

const resumeSchema = z.object({
  headline: z.string().max(120).optional().or(z.literal("")),
  summary: z.string().max(2000).optional().or(z.literal("")),
  skills: z.string().max(800).optional().or(z.literal("")),
  languages: z.string().max(500).optional().or(z.literal("")),
  experience: z.string().max(4000).optional().or(z.literal("")),
  experienceYears: z.string().max(40).optional().or(z.literal("")),
  education: z.string().max(3000).optional().or(z.literal("")),
  links: z.string().max(800).optional().or(z.literal("")),
  desiredRole: z.string().max(120).optional().or(z.literal("")),
  preferredCity: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  availability: z.string().max(80).optional().or(z.literal("")),
  workPreference: z.string().max(80).optional().or(z.literal("")),
  workAuthorization: z.string().max(80).optional().or(z.literal("")),
  drivingLicense: z.string().max(80).optional().or(z.literal("")),
  hobbies: z.string().max(1200).optional().or(z.literal("")),
  expectedSalary: z.string().max(80).optional().or(z.literal("")),
});

const candidateJobSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  description: z.string().min(20),
  location: z.string().min(2),
  companyId: z.string().min(1),
  categoryId: z.string().optional(),
  employmentType: z.enum(EmploymentType),
  isRemote: z.boolean(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  currency: z.enum(CURRENCY_CODES),
  expirationDate: z.coerce.date().optional(),
});

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  title: z.string().max(120).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  citizenship: z.string().max(120).optional().or(z.literal("")),
  birthDate: z.coerce.date().optional(),
  gender: z.string().max(40).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(1500).optional().or(z.literal("")),
  notifyNewApplicationEmail: z.boolean(),
  notifyDigestEmail: z.boolean(),
});

const myCompanySchema = z.object({
  name: z.string().min(2).max(120),
  location: z.string().min(2).max(120),
  logoUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  registrationNumber: z.string().min(3).max(64),
  vatNumber: z.string().max(64).optional().or(z.literal("")),
  industry: z.string().max(120).optional().or(z.literal("")),
  companySize: z.string().max(80).optional().or(z.literal("")),
  foundedYear: z.coerce.number().int().min(1800).max(2100).optional(),
  description: z.string().min(60).max(2000),
});

const categorySuggestionSchema = z.object({
  name: z.string().min(2).max(80),
  details: z.string().max(600).optional().or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
});

export async function updateMyProfile(formData: FormData) {
  const session = await requireUser();
  const fallbackPath = "/me/profile";
  const birthDateRaw = formData.get("birthDate");

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    city: formData.get("city"),
    citizenship: formData.get("citizenship"),
    birthDate: typeof birthDateRaw === "string" && birthDateRaw.trim().length > 0 ? birthDateRaw : undefined,
    gender: formData.get("gender"),
    website: formData.get("website"),
    linkedin: formData.get("linkedin"),
    github: formData.get("github"),
    bio: formData.get("bio"),
    notifyNewApplicationEmail: formData.get("notifyNewApplicationEmail") === "on",
    notifyDigestEmail: formData.get("notifyDigestEmail") === "on",
  });

  if (!parsed.success) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      title: parsed.data.title || null,
      city: parsed.data.city || null,
      citizenship: parsed.data.citizenship || null,
      birthDate: parsed.data.birthDate ?? null,
      gender: parsed.data.gender || null,
      website: parsed.data.website || null,
      linkedin: parsed.data.linkedin || null,
      github: parsed.data.github || null,
      bio: parsed.data.bio || null,
      notifyNewApplicationEmail: parsed.data.notifyNewApplicationEmail,
      notifyDigestEmail: parsed.data.notifyDigestEmail,
    },
  });

  revalidatePath("/me");
  revalidatePath("/me/profile");
  redirect(withToast(fallbackPath, "admin_success"));
}

export async function updateMyResume(formData: FormData) {
  const session = await requireUser();
  const fallbackPath = "/me/resume";

  const parsed = resumeSchema.safeParse({
    headline: formData.get("headline"),
    summary: formData.get("summary"),
    skills: formData.get("skills"),
    languages: formData.get("languages"),
    experience: formData.get("experience"),
    experienceYears: formData.get("experienceYears"),
    education: formData.get("education"),
    links: formData.get("links"),
    desiredRole: formData.get("desiredRole"),
    preferredCity: formData.get("preferredCity"),
    phone: formData.get("phone"),
    availability: formData.get("availability"),
    workPreference: formData.get("workPreference"),
    workAuthorization: formData.get("workAuthorization"),
    drivingLicense: formData.get("drivingLicense"),
    hobbies: formData.get("hobbies"),
    expectedSalary: formData.get("expectedSalary"),
  });

  if (!parsed.success) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  await prisma.resume.upsert({
    where: { userId: session.user.id },
    update: {
      headline: parsed.data.headline || null,
      summary: parsed.data.summary || null,
      skills: parsed.data.skills || null,
      languages: parsed.data.languages || null,
      experience: parsed.data.experience || null,
      experienceYears: parsed.data.experienceYears || null,
      education: parsed.data.education || null,
      links: parsed.data.links || null,
      desiredRole: parsed.data.desiredRole || null,
      preferredCity: parsed.data.preferredCity || null,
      phone: parsed.data.phone || null,
      availability: parsed.data.availability || null,
      workPreference: parsed.data.workPreference || null,
      workAuthorization: parsed.data.workAuthorization || null,
      drivingLicense: parsed.data.drivingLicense || null,
      hobbies: parsed.data.hobbies || null,
      expectedSalary: parsed.data.expectedSalary || null,
    },
    create: {
      userId: session.user.id,
      headline: parsed.data.headline || null,
      summary: parsed.data.summary || null,
      skills: parsed.data.skills || null,
      languages: parsed.data.languages || null,
      experience: parsed.data.experience || null,
      experienceYears: parsed.data.experienceYears || null,
      education: parsed.data.education || null,
      links: parsed.data.links || null,
      desiredRole: parsed.data.desiredRole || null,
      preferredCity: parsed.data.preferredCity || null,
      phone: parsed.data.phone || null,
      availability: parsed.data.availability || null,
      workPreference: parsed.data.workPreference || null,
      workAuthorization: parsed.data.workAuthorization || null,
      drivingLicense: parsed.data.drivingLicense || null,
      hobbies: parsed.data.hobbies || null,
      expectedSalary: parsed.data.expectedSalary || null,
    },
  });

  revalidatePath("/me/resume");
  revalidatePath("/me/profile");
  redirect(withToast(fallbackPath, "resume_saved"));
}

export async function createMyJob(formData: FormData) {
  const session = await requireEmployerUser();
  const fallbackPath = "/me/jobs";

  const salaryMinRaw = formData.get("salaryMin");
  const salaryMaxRaw = formData.get("salaryMax");

  const parsed = candidateJobSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    location: formData.get("location"),
    companyId: formData.get("companyId"),
    categoryId: formData.get("categoryId") || undefined,
    employmentType: formData.get("employmentType"),
    isRemote: formData.get("isRemote") === "on",
    salaryMin: typeof salaryMinRaw === "string" && salaryMinRaw ? Number(salaryMinRaw) : undefined,
    salaryMax: typeof salaryMaxRaw === "string" && salaryMaxRaw ? Number(salaryMaxRaw) : undefined,
    currency: String(formData.get("currency") || "EUR").toUpperCase(),
    expirationDate: formData.get("expirationDate") || undefined,
  });

  if (!parsed.success) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      requireCompanyBeforePosting: true,
      defaultCurrency: true,
      defaultJobExpirationDays: true,
      autoApproveCandidateJobs: true,
      minJobDescriptionLength: true,
      blockedKeywords: true,
    },
  });

  const sanitizedSummary = sanitizeRichText(parsed.data.summary);
  const sanitizedDescription = sanitizeRichText(parsed.data.description);
  const plainSummary = stripRichText(sanitizedSummary);
  const plainDescription = stripRichText(sanitizedDescription);

  if (plainSummary.length < 10 || plainDescription.length < (settings?.minJobDescriptionLength ?? 20)) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  const blockedKeywords = (settings?.blockedKeywords || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (blockedKeywords.length) {
    const haystack = `${parsed.data.title} ${plainSummary} ${plainDescription}`.toLowerCase();
    if (blockedKeywords.some((keyword) => haystack.includes(keyword))) {
      redirect(withToast(fallbackPath, "admin_error"));
    }
  }

  if (settings?.requireCompanyBeforePosting !== false) {
    const ownedCompany = await prisma.company.findFirst({
      where: {
        id: parsed.data.companyId,
        ownerId: session.user.id,
        isSuspended: false,
        verificationStatus: "VERIFIED",
      },
      select: { id: true },
    });

    if (!ownedCompany) {
      redirect(withToast(fallbackPath, "admin_error"));
    }
  }

  const expirationDate = parsed.data.expirationDate ?? (() => {
    const value = new Date();
    value.setDate(value.getDate() + (settings?.defaultJobExpirationDays ?? 30));
    return value;
  })();

  const referenceNumber = `#${Date.now().toString().slice(-8)}`;

  const created = await prisma.job.create({
    data: {
      title: parsed.data.title,
      slug: `${slugify(parsed.data.title)}-${Date.now()}`,
      summary: sanitizedSummary,
      description: sanitizedDescription,
      location: parsed.data.location,
      companyId: parsed.data.companyId,
      categoryId: parsed.data.categoryId || null,
      employmentType: parsed.data.employmentType,
      status: settings?.autoApproveCandidateJobs ? "PUBLISHED" : "DRAFT",
      isRemote: parsed.data.isRemote,
      salaryMin: parsed.data.salaryMin,
      salaryMax: parsed.data.salaryMax,
      currency: parsed.data.currency || settings?.defaultCurrency || "EUR",
      expirationDate,
      referenceNumber,
      publishedAt: settings?.autoApproveCandidateJobs ? new Date() : null,
      createdById: session.user.id,
    },
  });

  await sendWebhookEvent("job_created", {
    jobId: created.id,
    title: created.title,
    createdById: created.createdById,
    status: created.status,
  });

  const owner = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, preferredLocale: true },
  });
  if (owner) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendTemplatedEmail({
      to: owner.email,
      templateKey: "NEW_JOB_POSTED",
      locale: owner.preferredLocale,
      variables: {
        name: owner.name || "Owner",
        jobTitle: created.title,
        referenceNumber: created.referenceNumber || "-",
        status: created.status,
        manageUrl: `${baseUrl.replace(/\/$/, "")}/me/jobs`,
      },
    });
  }

  revalidatePath("/me/jobs");
  redirect(withToast(fallbackPath, "admin_success"));
}

export async function createMyCompany(formData: FormData) {
  const session = await requireEmployerUser();
  const fallbackPath = "/me/companies";

  const suspendedCompany = await prisma.company.findFirst({
    where: { ownerId: session.user.id, isSuspended: true },
    select: { id: true },
  });

  if (suspendedCompany) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  const parsed = myCompanySchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    logoUrl: formData.get("logoUrl"),
    website: formData.get("website"),
    registrationNumber: formData.get("registrationNumber"),
    vatNumber: formData.get("vatNumber"),
    industry: formData.get("industry"),
    companySize: formData.get("companySize"),
    foundedYear: formData.get("foundedYear") || undefined,
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  try {
    await prisma.company.create({
      data: {
        name: parsed.data.name,
        slug: `${slugify(parsed.data.name)}-${Date.now().toString().slice(-6)}`,
        logoUrl: parsed.data.logoUrl || null,
        location: parsed.data.location,
        website: parsed.data.website || null,
        registrationNumber: parsed.data.registrationNumber,
        vatNumber: parsed.data.vatNumber || null,
        industry: parsed.data.industry || null,
        companySize: parsed.data.companySize || null,
        foundedYear: parsed.data.foundedYear || null,
        description: parsed.data.description || null,
        ownerId: session.user.id,
      },
    });
  } catch {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  revalidatePath("/me/jobs");
  revalidatePath("/me/companies");
  redirect(withToast(fallbackPath, "admin_success"));
}

export async function updateMyCompany(formData: FormData) {
  const session = await requireEmployerUser();
  const fallbackPath = "/me/companies";
  const id = formData.get("id");

  if (typeof id !== "string") {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  const parsed = myCompanySchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    logoUrl: formData.get("logoUrl"),
    website: formData.get("website"),
    registrationNumber: formData.get("registrationNumber"),
    vatNumber: formData.get("vatNumber"),
    industry: formData.get("industry"),
    companySize: formData.get("companySize"),
    foundedYear: formData.get("foundedYear") || undefined,
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  const existing = await prisma.company.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });

  if (!existing || existing.ownerId !== session.user.id) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  try {
    await prisma.company.update({
      where: { id },
      data: {
        name: parsed.data.name,
        location: parsed.data.location,
        logoUrl: parsed.data.logoUrl || null,
        website: parsed.data.website || null,
        registrationNumber: parsed.data.registrationNumber,
        vatNumber: parsed.data.vatNumber || null,
        industry: parsed.data.industry || null,
        companySize: parsed.data.companySize || null,
        foundedYear: parsed.data.foundedYear || null,
        description: parsed.data.description || null,
      },
    });
  } catch {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  revalidatePath("/me/companies");
  revalidatePath("/me/jobs");
  revalidatePath("/jobs");
  redirect(withToast(fallbackPath, "admin_success"));
}

export async function createCategorySuggestion(formData: FormData) {
  const session = await requireEmployerUser();
  const fallbackPath = "/me/companies";

  const parsed = categorySuggestionSchema.safeParse({
    name: formData.get("name"),
    details: formData.get("details"),
    companyId: formData.get("companyId"),
  });

  if (!parsed.success) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  const normalizedName = parsed.data.name.trim().toLowerCase();
  const slug = slugify(parsed.data.name);

  const [existingCategory, existingPending, ownedCompany] = await Promise.all([
    prisma.category.findUnique({ where: { slug }, select: { id: true } }),
    prisma.categorySuggestion.findFirst({
      where: { normalizedName, status: "PENDING" },
      select: { id: true },
    }),
    parsed.data.companyId
      ? prisma.company.findFirst({
          where: { id: parsed.data.companyId, ownerId: session.user.id },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (existingCategory || existingPending) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  if (parsed.data.companyId && !ownedCompany) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  try {
    await prisma.categorySuggestion.create({
      data: {
        name: parsed.data.name.trim(),
        normalizedName,
        details: parsed.data.details?.trim() || null,
        suggestedById: session.user.id,
        companyId: parsed.data.companyId || null,
      },
    });
  } catch {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  revalidatePath("/me/companies");
  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  redirect(withToast(fallbackPath, "admin_success"));
}

export async function deleteMyCompany(formData: FormData) {
  const session = await requireEmployerUser();
  const fallbackPath = "/me/companies";
  const id = formData.get("id");

  if (typeof id !== "string") {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  const existing = await prisma.company.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });

  if (!existing || existing.ownerId !== session.user.id) {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  try {
    await prisma.company.delete({ where: { id } });
  } catch {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  revalidatePath("/me/companies");
  revalidatePath("/me/jobs");
  revalidatePath("/jobs");
  redirect(withToast(fallbackPath, "admin_success"));
}

export async function submitMyJobForReview(formData: FormData) {
  const session = await requireEmployerUser();
  const fallbackPath = "/me/jobs";
  const jobId = formData.get("id");

  if (typeof jobId !== "string") {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  const existing = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, createdById: true, status: true },
  });

  if (!existing || existing.createdById !== session.user.id || existing.status !== "DRAFT") {
    redirect(withToast(fallbackPath, "admin_error"));
  }

  await prisma.job.update({
    where: { id: existing.id },
    data: {
      status: "PENDING_REVIEW",
      moderationNote: null,
    },
  });

  revalidatePath("/me/jobs");
  revalidatePath("/admin/jobs");
  redirect(withToast(fallbackPath, "admin_success"));
}
