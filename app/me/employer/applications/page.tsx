import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationStatus } from "@prisma/client";
import { ApplicationThread } from "@/components/application-thread";
import { addApplicationNote, sendApplicationMessage, updateApplicationPipelineStatus } from "@/lib/application-actions";
import { getApplicationStatusBadgeClass, getApplicationStatusLabels } from "@/lib/application-status";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { relativeDate } from "@/lib/jobs-query";

export const metadata: Metadata = { title: "My applications" };

const PIPELINE_STATUSES: ApplicationStatus[] = ["NEW", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

function parseResumeSnapshot(raw: string | null) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as {
      headline?: string | null;
      desiredRole?: string | null;
      preferredCity?: string | null;
      summary?: string | null;
      skills?: string | null;
    };
  } catch {
    return null;
  }
}

export default async function WorkspaceApplicationsPage() {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const statusLabels = getApplicationStatusLabels(locale);
  const isEmployer = session?.user.accountType === "employer";

  if (!session) {
    return null;
  }

  const [applications, incomingApplications] = await Promise.all([
    prisma.application.findMany({
      where: { userId: session.user.id },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        messages: {
          include: { sender: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      where: { job: { createdById: session.user.id } },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        messages: {
          include: { sender: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
        notes: {
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();
  await Promise.all([
    applications.length
      ? prisma.application.updateMany({
          where: { id: { in: applications.map((item) => item.id) } },
          data: { lastReadByCandidateAt: now },
        })
      : Promise.resolve({ count: 0 }),
    incomingApplications.length
      ? prisma.application.updateMany({
          where: { id: { in: incomingApplications.map((item) => item.id) } },
          data: { lastReadByOwnerAt: now },
        })
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{dict.me.myApplications}</h1>

      {!isEmployer ? (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Aplicatiile mele (candidat)" : "My applications (candidate)"}</h2>
        <div className="mt-4 space-y-3">
          {applications.map((application) => {
            const unreadCount = application.messages.filter(
              (msg) =>
                msg.sender.id !== session.user.id &&
                (!application.lastReadByCandidateAt || msg.createdAt > application.lastReadByCandidateAt)
            ).length;
            return (
            <article key={application.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{application.job.title}</p>
                  <p className="text-xs text-slate-500">
                    {application.job.company.name} - {statusLabels[application.status]}
                  </p>
                </div>
                <div className="text-right">
                  {unreadCount > 0 && (
                    <p className="mb-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      {unreadCount} {isRo ? "necitite" : "unread"}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {dict.me.submittedOn}: {relativeDate(application.createdAt, locale)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Link href={`/jobs/${application.job.slug}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
                  {dict.common.viewJob}
                </Link>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Conversatie" : "Conversation"}</p>
                <div className="mt-2">
                  <ApplicationThread
                    locale={locale}
                    currentUserId={session.user.id}
                    messages={application.messages.map((msg) => ({
                      id: msg.id,
                      content: msg.content,
                      createdAt: msg.createdAt.toISOString(),
                      sender: { id: msg.sender.id, name: msg.sender.name },
                    }))}
                    emptyLabel={isRo ? "Nicio conversatie inca." : "No conversation yet."}
                  />
                </div>
                <form action={sendApplicationMessage} className="mt-2 flex gap-2">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <input
                    name="content"
                    required
                    placeholder={isRo ? "Trimite mesaj catre recruiter..." : "Send a message to recruiter..."}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                    {isRo ? "Trimite" : "Send"}
                  </button>
                </form>
              </div>
            </article>
            );
          })}

          {applications.length === 0 && <p className="text-sm text-slate-600">{dict.me.noApplications}</p>}
        </div>
      </section>
      ) : null}

      {isEmployer ? (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Aplicatii primite la joburile mele" : "Applications received for my jobs"}</h2>
        <div className="mt-4 space-y-3">
          {incomingApplications.map((application) => {
            const unreadCount = application.messages.filter(
              (msg) =>
                msg.sender.id !== session.user.id &&
                (!application.lastReadByOwnerAt || msg.createdAt > application.lastReadByOwnerAt)
            ).length;
            const resumeSnapshot = parseResumeSnapshot(application.resumeSnapshot);
            return (
            <article key={application.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{application.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {application.email} - {application.job.title} ({application.job.company.name})
                  </p>
                </div>
                <div className="text-right">
                  {unreadCount > 0 && (
                    <p className="mb-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      {unreadCount} {isRo ? "necitite" : "unread"}
                    </p>
                  )}
                  <p className={`rounded-full px-3 py-1 text-xs font-semibold ${getApplicationStatusBadgeClass(application.status)}`}>{statusLabels[application.status]}</p>
                </div>
              </div>
              <div className="mt-3">
                <form action={updateApplicationPipelineStatus} className="flex items-center gap-2">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <select name="status" defaultValue={application.status} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    {PIPELINE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
                    {isRo ? "Actualizeaza status" : "Update status"}
                  </button>
                </form>
              </div>
              {application.cvUrl && (
                <p className="mt-2 text-sm">
                  CV: <a className="text-slate-900 underline" href={application.cvUrl} target="_blank" rel="noreferrer">{application.cvUrl}</a>
                </p>
              )}
              {application.cvSource && (
                <p className="mt-2 text-xs text-slate-500">
                  {isRo ? "Sursa CV" : "CV source"}:{" "}
                  <span className="font-medium text-slate-700">
                    {application.cvSource === "profile"
                      ? isRo
                        ? "CV din profil"
                        : "Profile CV"
                      : isRo
                        ? "Upload / Link"
                        : "Upload / Link"}
                  </span>
                </p>
              )}
              {resumeSnapshot ? (
                <details className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <summary className="cursor-pointer font-medium">
                    {isRo ? "Snapshot CV (la momentul aplicarii)" : "CV snapshot (at application time)"}
                  </summary>
                  <div className="mt-2 space-y-1">
                    {resumeSnapshot.headline && <p><span className="font-medium">{isRo ? "Headline" : "Headline"}:</span> {resumeSnapshot.headline}</p>}
                    {resumeSnapshot.desiredRole && <p><span className="font-medium">{isRo ? "Rol dorit" : "Desired role"}:</span> {resumeSnapshot.desiredRole}</p>}
                    {resumeSnapshot.preferredCity && <p><span className="font-medium">{dict.jobs.location}:</span> {resumeSnapshot.preferredCity}</p>}
                    {resumeSnapshot.skills && <p><span className="font-medium">{isRo ? "Skill-uri" : "Skills"}:</span> {resumeSnapshot.skills}</p>}
                    {resumeSnapshot.summary && <p><span className="font-medium">{isRo ? "Sumar" : "Summary"}:</span> {resumeSnapshot.summary}</p>}
                  </div>
                </details>
              ) : null}
              {application.message && <p className="mt-2 text-sm text-slate-700">{application.message}</p>}
              <p className="mt-2 text-xs text-slate-500">
                {dict.me.submittedOn}: {relativeDate(application.createdAt, locale)}
              </p>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Mesaje" : "Messages"}</p>
                  <div className="mt-2">
                    <ApplicationThread
                      locale={locale}
                      currentUserId={session.user.id}
                      messages={application.messages.map((msg) => ({
                        id: msg.id,
                        content: msg.content,
                        createdAt: msg.createdAt.toISOString(),
                        sender: { id: msg.sender.id, name: msg.sender.name },
                      }))}
                      emptyLabel={isRo ? "Niciun mesaj." : "No messages yet."}
                    />
                  </div>
                  <form action={sendApplicationMessage} className="mt-2 flex gap-2">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input name="content" required placeholder={isRo ? "Mesaj catre candidat..." : "Message to candidate..."} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                      {isRo ? "Trimite" : "Send"}
                    </button>
                  </form>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Note interne" : "Internal notes"}</p>
                  <div className="mt-2 space-y-2">
                    {application.notes.map((note) => (
                      <p key={note.id} className="text-sm text-slate-700">
                        <span className="font-medium text-slate-900">{note.author.name}:</span> {note.content}
                      </p>
                    ))}
                    {application.notes.length === 0 && <p className="text-xs text-slate-500">{isRo ? "Nicio nota." : "No notes yet."}</p>}
                  </div>
                  <form action={addApplicationNote} className="mt-2 flex gap-2">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input name="content" required placeholder={isRo ? "Adauga nota interna..." : "Add internal note..."} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
                      {isRo ? "Adauga" : "Add"}
                    </button>
                  </form>
                </div>
              </div>
            </article>
            );
          })}

          {incomingApplications.length === 0 && (
            <p className="text-sm text-slate-600">{isRo ? "Nu ai aplicatii primite momentan." : "No received applications yet."}</p>
          )}
        </div>
      </section>
      ) : null}
    </div>
  );
}
