import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmploymentType, JobStatus } from "@prisma/client";
import { AdminJobApplicationsPanel } from "@/components/admin-job-applications-panel";
import { RichTextEditorField } from "@/components/rich-text-editor-field";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { approvePendingJob, rejectPendingJob, updateJob } from "@/lib/admin-actions";
import { getEmploymentTypeLabels, getJobStatusLabels } from "@/lib/jobs-query";
export const metadata: Metadata = { title: "Edit job" };


type EditJobPageProps = { params: Promise<{ id: string }> };

export default async function EditJobPage({ params }: EditJobPageProps) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const employmentTypeLabels = getEmploymentTypeLabels(locale);
  const jobStatusLabels = getJobStatusLabels(locale);
  const { id } = await params;

  const [job, companies, categories, applications] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.application.findMany({
      where: { jobId: id },
      include: {
        user: { select: { name: true, email: true } },
        messages: {
          include: { sender: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
        notes: {
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const locationSuggestions = Array.from(new Set([...companies.map((item) => item.location), job?.location || ""])).filter(Boolean).sort((a, b) => a.localeCompare(b));

  if (!job) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{dict.admin.editJob}</h1>

      {job.status === "PENDING_REVIEW" ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
          <h2 className="text-lg font-semibold text-slate-900">{dict.admin.pendingReviewJobs}</h2>
          <p className="mt-1 text-sm text-slate-700">
            {locale === "ro"
              ? "Verifica detaliile jobului si decide aprobarea sau respingerea in draft."
              : "Review job details and decide approval or reject back to draft."}
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <form action={approvePendingJob} className="space-y-2">
              <input type="hidden" name="id" value={job.id} />
              <textarea
                name="moderationNote"
                defaultValue={job.moderationNote || ""}
                placeholder={dict.admin.moderationNotePlaceholder}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="w-full rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50">
                {dict.admin.approve}
              </button>
            </form>

            <form action={rejectPendingJob} className="space-y-2">
              <input type="hidden" name="id" value={job.id} />
              <textarea
                name="moderationNote"
                defaultValue={job.moderationNote || ""}
                placeholder={dict.admin.moderationNotePlaceholder}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="w-full rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50">
                {dict.admin.rejectToDraft}
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <form action={updateJob} className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <input type="hidden" name="id" value={job.id} />
        <input name="title" defaultValue={job.title} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input list="admin-edit-job-locations" name="location" defaultValue={job.location} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <RichTextEditorField
          name="summary"
          label={locale === "ro" ? "Sumar" : "Summary"}
          description={locale === "ro" ? "Apare in lista joburilor." : "Displayed in jobs listing."}
          placeholder={locale === "ro" ? "Sumar job" : "Job summary"}
          required
          defaultValue={job.summary}
          className="md:col-span-2"
        />
        <RichTextEditorField
          name="description"
          label={locale === "ro" ? "Descriere completa" : "Full description"}
          description={locale === "ro" ? "Detalii complete pentru candidati." : "Complete details for candidates."}
          placeholder={locale === "ro" ? "Descriere job" : "Job description"}
          required
          defaultValue={job.description}
          className="md:col-span-2"
        />

        <select name="companyId" defaultValue={job.companyId} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <select name="categoryId" defaultValue={job.categoryId || ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">{dict.admin.noCategory}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select name="employmentType" defaultValue={job.employmentType} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {Object.values(EmploymentType).map((item) => (
            <option key={item} value={item}>
              {employmentTypeLabels[item]}
            </option>
          ))}
        </select>

        <select name="status" defaultValue={job.status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {Object.values(JobStatus).map((item) => (
            <option key={item} value={item}>
              {jobStatusLabels[item]}
            </option>
          ))}
        </select>

        <input type="number" name="salaryMin" min={0} defaultValue={job.salaryMin || ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input type="number" name="salaryMax" min={0} defaultValue={job.salaryMax || ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select name="currency" defaultValue={job.currency} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="EUR">{locale === "ro" ? "Euro (EUR)" : "Euro (EUR)"}</option>
          <option value="USD">{locale === "ro" ? "Dolar american (USD)" : "US Dollar (USD)"}</option>
          <option value="RON">{locale === "ro" ? "Leu romanesc (RON)" : "Romanian Leu (RON)"}</option>
        </select>
        <input type="date" name="expirationDate" defaultValue={job.expirationDate ? job.expirationDate.toISOString().slice(0, 10) : ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={job.referenceNumber || "-"} readOnly disabled className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600" />

        <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <input type="checkbox" name="isRemote" defaultChecked={job.isRemote} /> {dict.admin.remote}
        </label>

        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2">
          {dict.admin.saveChanges}
        </button>
        <datalist id="admin-edit-job-locations">
          {locationSuggestions.map((location) => (
            <option key={location} value={location} />
          ))}
        </datalist>
      </form>

      <AdminJobApplicationsPanel
        locale={locale}
        applications={applications.map((application) => ({
          id: application.id,
          fullName: application.fullName,
          email: application.email,
          status: application.status,
          cvUrl: application.cvUrl,
          cvSource: application.cvSource,
          resumeSnapshot: application.resumeSnapshot,
          message: application.message,
          createdAt: application.createdAt.toISOString(),
          user: application.user ? { name: application.user.name, email: application.user.email } : null,
          messages: application.messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            sender: { name: msg.sender.name },
          })),
          notes: application.notes.map((note) => ({
            id: note.id,
            content: note.content,
            author: { name: note.author.name },
          })),
        }))}
      />
    </div>
  );
}

