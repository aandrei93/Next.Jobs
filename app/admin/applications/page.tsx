import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getApplicationStatusBadgeClass, getApplicationStatusLabels } from "@/lib/application-status";
import { getDictionary, getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Applications" };

type AdminApplicationsPageProps = {
  searchParams: Promise<{ scope?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }
  return Array.isArray(value) ? value[0] : value;
}

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

export default async function AdminApplicationsPage({ searchParams }: AdminApplicationsPageProps) {
  const [locale, rawSearchParams] = await Promise.all([getLocale(), searchParams]);
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const statusLabels = getApplicationStatusLabels(locale);
  const selectedScope = firstValue(rawSearchParams.scope);
  const scope = selectedScope === "candidate" || selectedScope === "employer" ? selectedScope : "";

  const applications = await prisma.application.findMany({
    where:
      scope === "candidate"
        ? { user: { accountType: "candidate" } }
        : scope === "employer"
          ? { job: { createdBy: { accountType: "employer" } } }
          : undefined,
    include: {
      job: {
        include: {
          company: true,
          createdBy: { select: { name: true, email: true } },
        },
      },
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
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dict.admin.applications}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Spy mode: vizibilitate completa pe pipeline, conversatii si note interne." : "Spy mode: full visibility for pipeline, conversations, and internal notes."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Perspectiva fluxului" : "Flow perspective"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/applications" className={`rounded-md border px-3 py-1.5 text-sm ${scope === "" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
            {isRo ? "Toate aplicatiile" : "All applications"}
          </Link>
          <Link href="/admin/applications?scope=candidate" className={`rounded-md border px-3 py-1.5 text-sm ${scope === "candidate" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
            {isRo ? "Flux candidat" : "Candidate flow"}
          </Link>
          <Link href="/admin/applications?scope=employer" className={`rounded-md border px-3 py-1.5 text-sm ${scope === "employer" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
            {isRo ? "Flux angajator" : "Employer flow"}
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-3">
          {applications.map((application) => {
            const resumeSnapshot = parseResumeSnapshot(application.resumeSnapshot);
            return (
            <article key={application.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{application.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {application.email} - {application.job.title} ({application.job.company.name})
                  </p>
                  <p className="text-xs text-slate-500">
                    Owner: {application.job.createdBy.name} ({application.job.createdBy.email})
                  </p>
                </div>
                <p className={`rounded-full px-3 py-1 text-xs font-semibold ${getApplicationStatusBadgeClass(application.status)}`}>{statusLabels[application.status]}</p>
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
                    {resumeSnapshot.headline && <p><span className="font-medium">Headline:</span> {resumeSnapshot.headline}</p>}
                    {resumeSnapshot.desiredRole && <p><span className="font-medium">{isRo ? "Rol dorit" : "Desired role"}:</span> {resumeSnapshot.desiredRole}</p>}
                    {resumeSnapshot.preferredCity && <p><span className="font-medium">{isRo ? "Oras dorit" : "Preferred city"}:</span> {resumeSnapshot.preferredCity}</p>}
                    {resumeSnapshot.skills && <p><span className="font-medium">{isRo ? "Skill-uri" : "Skills"}:</span> {resumeSnapshot.skills}</p>}
                    {resumeSnapshot.summary && <p><span className="font-medium">{isRo ? "Sumar" : "Summary"}:</span> {resumeSnapshot.summary}</p>}
                  </div>
                </details>
              ) : null}
              {application.message && <p className="mt-2 text-sm text-slate-700">{application.message}</p>}

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Conversatii" : "Conversations"}</p>
                  <div className="mt-2 space-y-2">
                    {application.messages.map((msg) => (
                      <p key={msg.id} className="text-sm text-slate-700">
                        <span className="font-medium text-slate-900">{msg.sender.name}:</span> {msg.content}
                      </p>
                    ))}
                    {application.messages.length === 0 && <p className="text-xs text-slate-500">{isRo ? "Nicio conversatie." : "No conversations."}</p>}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Note interne" : "Internal notes"}</p>
                  <div className="mt-2 space-y-2">
                    {application.notes.map((note) => (
                      <p key={note.id} className="text-sm text-slate-700">
                        <span className="font-medium text-slate-900">{note.author.name}:</span> {note.content}
                      </p>
                    ))}
                    {application.notes.length === 0 && <p className="text-xs text-slate-500">{isRo ? "Nicio nota." : "No notes."}</p>}
                  </div>
                </div>
              </div>
            </article>
            );
          })}
          {applications.length === 0 && <p className="text-sm text-slate-600">{dict.admin.noApplications}</p>}
        </div>
      </section>
    </div>
  );
}
