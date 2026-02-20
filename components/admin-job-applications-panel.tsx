"use client";

import { useMemo, useState } from "react";
import { APPLICATION_PIPELINE, getApplicationStatusBadgeClass, getApplicationStatusLabels } from "@/lib/application-status";

type ApplicationItem = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  cvUrl: string | null;
  cvSource: string | null;
  resumeSnapshot: string | null;
  message: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
  messages: Array<{ id: string; content: string; sender: { name: string } }>;
  notes: Array<{ id: string; content: string; author: { name: string } }>;
};

type AdminJobApplicationsPanelProps = {
  locale: "ro" | "en";
  applications: ApplicationItem[];
};

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

export function AdminJobApplicationsPanel({ locale, applications }: AdminJobApplicationsPanelProps) {
  const isRo = locale === "ro";
  const statusLabels = getApplicationStatusLabels(locale);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cvSourceFilter, setCvSourceFilter] = useState("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      const byStatus = statusFilter === "all" || application.status === statusFilter;
      const byCvSource = cvSourceFilter === "all" || (application.cvSource || "upload") === cvSourceFilter;
      const byQuery =
        !normalizedQuery ||
        application.fullName.toLowerCase().includes(normalizedQuery) ||
        application.email.toLowerCase().includes(normalizedQuery) ||
        (application.user?.name || "").toLowerCase().includes(normalizedQuery) ||
        (application.user?.email || "").toLowerCase().includes(normalizedQuery);
      return byStatus && byCvSource && byQuery;
    });
  }, [applications, cvSourceFilter, query, statusFilter]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">{isRo ? "Aplicatii pentru acest job" : "Applications for this job"}</h2>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {isRo ? "Rezultate" : "Results"}: {filtered.length} / {applications.length}
        </p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={isRo ? "Cauta dupa nume sau email..." : "Search by name or email..."}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">{isRo ? "Toate statusurile" : "All statuses"}</option>
          {APPLICATION_PIPELINE.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
        <select value={cvSourceFilter} onChange={(event) => setCvSourceFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">{isRo ? "Toate sursele CV" : "All CV sources"}</option>
          <option value="profile">{isRo ? "CV din profil" : "Profile CV"}</option>
          <option value="upload">{isRo ? "Upload / Link" : "Upload / Link"}</option>
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((application) => {
          const resumeSnapshot = parseResumeSnapshot(application.resumeSnapshot);
          return (
            <article key={application.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{application.fullName}</p>
                  <p className="text-xs text-slate-500">{application.email}</p>
                  <p className="text-xs text-slate-500">
                    {isRo ? "Utilizator" : "User"}: {application.user?.name || "-"} ({application.user?.email || "-"})
                  </p>
                </div>
                <p className={`rounded-full px-3 py-1 text-xs font-semibold ${getApplicationStatusBadgeClass(application.status as (typeof APPLICATION_PIPELINE)[number])}`}>
                  {statusLabels[application.status as keyof typeof statusLabels] || application.status}
                </p>
              </div>

              {application.cvUrl && (
                <p className="mt-2 text-sm">
                  CV:{" "}
                  <a className="text-slate-900 underline" href={application.cvUrl} target="_blank" rel="noreferrer">
                    {application.cvUrl}
                  </a>
                </p>
              )}
              {application.cvSource && (
                <p className="mt-2 text-xs text-slate-500">
                  {isRo ? "Sursa CV" : "CV source"}:{" "}
                  <span className="font-medium text-slate-700">
                    {application.cvSource === "profile" ? (isRo ? "CV din profil" : "Profile CV") : isRo ? "Upload / Link" : "Upload / Link"}
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
        {filtered.length === 0 && (
          <p className="text-sm text-slate-600">
            {isRo ? "Nu exista aplicatii care sa respecte filtrele." : "No applications match current filters."}
          </p>
        )}
      </div>
    </section>
  );
}
