"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { createApplication } from "@/lib/public-actions";

type JobApplyFormProps = {
  jobId: string;
  sessionUser?: {
    name?: string | null;
    email?: string | null;
  };
  hasProfileResume: boolean;
  locale: "ro" | "en";
  labels: {
    fullName: string;
    emailPlaceholder: string;
    cvLink: string;
    message: string;
    submitApplication: string;
  };
};

export function JobApplyForm({ jobId, sessionUser, hasProfileResume, locale, labels }: JobApplyFormProps) {
  const isRo = locale === "ro";
  const isAuthenticatedCandidate = Boolean(sessionUser?.email);
  const canUseProfileResume = isAuthenticatedCandidate && hasProfileResume;
  const lockIdentityFields = isAuthenticatedCandidate;
  const [cvMode, setCvMode] = useState<"profile" | "upload">(canUseProfileResume ? "profile" : "upload");
  const [uploadingCv, setUploadingCv] = useState(false);
  const cvUrlInputRef = useRef<HTMLInputElement | null>(null);

  async function onCvFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingCv(true);
    const data = new FormData();
    data.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: data,
    });

    setUploadingCv(false);
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { url?: string };
    if (payload.url && cvUrlInputRef.current) {
      cvUrlInputRef.current.value = payload.url;
    }
  }

  return (
    <form action={createApplication} className="space-y-3">
      <input type="hidden" name="jobId" value={jobId} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <input type="hidden" name="cvMode" value={cvMode} />

      {isAuthenticatedCandidate ? (
        <>
          <input type="hidden" name="fullName" value={sessionUser?.name || ""} />
          <input type="hidden" name="email" value={sessionUser?.email || ""} />
          <input
            defaultValue={sessionUser?.name || ""}
            disabled
            placeholder={labels.fullName}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"
          />
          <input
            type="email"
            defaultValue={sessionUser?.email || ""}
            disabled
            placeholder={labels.emailPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"
          />
        </>
      ) : (
        <>
          <input
            name="fullName"
            required
            defaultValue={sessionUser?.name || ""}
            placeholder={labels.fullName}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
          <input
            type="email"
            name="email"
            required
            defaultValue={sessionUser?.email || ""}
            placeholder={labels.emailPlaceholder}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </>
      )}
      {lockIdentityFields ? (
        <p className="text-xs text-slate-500">
          {isRo
            ? "Datele sunt preluate din contul autentificat si nu pot fi modificate aici."
            : "Identity is taken from your signed-in account and cannot be edited here."}
        </p>
      ) : null}

      {isAuthenticatedCandidate ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isRo ? "Tip CV la aplicare" : "CV source"}
          </p>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={cvMode === "profile"}
              onChange={() => setCvMode("profile")}
              disabled={!canUseProfileResume}
            />
            <span className={!canUseProfileResume ? "text-slate-400" : ""}>
              {isRo ? "Foloseste CV-ul din profil" : "Use profile CV"}
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={cvMode === "upload"}
              onChange={() => setCvMode("upload")}
            />
            <span>{isRo ? "Incarca CV" : "Upload CV"}</span>
          </label>
          {!canUseProfileResume ? (
            <p className="text-xs text-amber-700">
              {isRo ? "Nu ai inca un CV completat in profil. Poti incarca un CV." : "No profile CV found yet. You can upload one."}
            </p>
          ) : null}
        </div>
      ) : null}

      {isAuthenticatedCandidate && cvMode === "profile" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {isRo
            ? "Aplicatia va include snapshot-ul CV-ului tau actual din profil."
            : "Application will include a snapshot of your current profile CV."}
        </p>
      ) : isAuthenticatedCandidate ? (
        <div className="space-y-2">
          <input ref={cvUrlInputRef} type="hidden" name="cvUrl" />
          <div className="space-y-1">
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={onCvFileChange} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            {uploadingCv ? <p className="text-xs text-slate-500">{isRo ? "Se incarca..." : "Uploading..."}</p> : null}
          </div>
        </div>
      ) : (
        <input
          ref={cvUrlInputRef}
          name="cvUrl"
          placeholder={labels.cvLink}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        />
      )}

      <textarea name="message" rows={4} placeholder={labels.message} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
      <button className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
        {labels.submitApplication}
      </button>
    </form>
  );
}
