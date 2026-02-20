"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TemplateItem = {
  key: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  isEnabled: boolean;
  isCustom: boolean;
};

type AdminEmailTemplatesEditorProps = {
  templates: TemplateItem[];
  isRo: boolean;
  templateLocale: "ro" | "en";
  saveAction: (formData: FormData) => Promise<void>;
};

function getTemplateMeta(key: string, isRo: boolean) {
  const map: Record<string, { labelRo: string; labelEn: string; descRo: string; descEn: string; placeholders: string[] }> = {
    WELCOME_CANDIDATE: {
      labelRo: "Email Bun Venit Candidat",
      labelEn: "Candidate Welcome Email",
      descRo: "Trimis dupa inregistrare, cu datele de acces.",
      descEn: "Sent after registration, with access details.",
      placeholders: ["name", "email", "password", "loginUrl"],
    },
    NEW_JOB_POSTED: {
      labelRo: "Confirmare Job Nou",
      labelEn: "New Job Confirmation",
      descRo: "Trimis owner-ului cand adauga un job nou.",
      descEn: "Sent to owner when a new job is created.",
      placeholders: ["name", "jobTitle", "referenceNumber", "status", "manageUrl"],
    },
    JOB_REVIEW_DECISION: {
      labelRo: "Decizie Review Job",
      labelEn: "Job Review Decision",
      descRo: "Trimis owner-ului dupa aprobarea sau respingerea jobului in moderare.",
      descEn: "Sent to owner after job moderation approval or rejection.",
      placeholders: ["name", "jobTitle", "decision", "referenceNumber", "moderationNote", "manageUrl"],
    },
    NEW_APPLICATION_OWNER: {
      labelRo: "Alerta Aplicare Noua",
      labelEn: "New Application Alert",
      descRo: "Trimis owner-ului cand primeste o aplicare noua.",
      descEn: "Sent to owner when a new application is received.",
      placeholders: ["ownerName", "jobTitle", "candidateName", "candidateEmail", "applicationsUrl"],
    },
    NEW_MESSAGE_OWNER: {
      labelRo: "Mesaj Nou de la Candidat",
      labelEn: "New Candidate Message",
      descRo: "Trimis owner-ului cand candidatul trimite mesaj.",
      descEn: "Sent to owner when candidate sends a message.",
      placeholders: ["ownerName", "jobTitle", "applicationsUrl"],
    },
    NEW_MESSAGE_CANDIDATE: {
      labelRo: "Mesaj Nou de la Recruiter",
      labelEn: "New Recruiter Message",
      descRo: "Trimis candidatului cand recruiterul trimite mesaj.",
      descEn: "Sent to candidate when recruiter sends a message.",
      placeholders: ["candidateName", "jobTitle", "applicationsUrl"],
    },
  };

  const meta = map[key];
  if (!meta) {
    return {
      label: key,
      description: isRo ? "Template email" : "Email template",
      placeholders: [],
    };
  }

  return {
    label: isRo ? meta.labelRo : meta.labelEn,
    description: isRo ? meta.descRo : meta.descEn,
    placeholders: meta.placeholders,
  };
}

export function AdminEmailTemplatesEditor({ templates, isRo, templateLocale, saveAction }: AdminEmailTemplatesEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedFromUrl = searchParams.get("tpl");

  const selected = useMemo(() => {
    if (selectedFromUrl) {
      const found = templates.find((item) => item.key === selectedFromUrl);
      if (found) return found;
    }
    return templates[0] || null;
  }, [selectedFromUrl, templates]);

  function selectTemplate(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tpl", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (!selected) {
    return <p className="text-sm text-slate-600">{isRo ? "Nu exista template-uri." : "No templates available."}</p>;
  }
  const selectedMeta = getTemplateMeta(selected.key, isRo);

  function setTemplateLocale(nextLocale: "ro" | "en") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLocale);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          {isRo ? "Template-uri" : "Templates"}
        </p>
        <div className="space-y-2">
          {templates.map((item) => {
            const active = item.key === selected.key;
            const meta = getTemplateMeta(item.key, isRo);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => selectTemplate(item.key)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <p className="font-semibold">{meta.label}</p>
                <p className={`text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>{meta.description}</p>
                <p className={`text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>
                  {item.isCustom ? (isRo ? "Custom" : "Custom") : (isRo ? "Default" : "Default")}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <section key={`${selected.key}-${templateLocale}`} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{selectedMeta.label}</h2>
        <p className="mt-1 text-xs text-slate-500">{selectedMeta.description}</p>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-mono text-slate-500">{selected.key}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTemplateLocale("ro")}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${templateLocale === "ro" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
            >
              RO
            </button>
            <button
              type="button"
              onClick={() => setTemplateLocale("en")}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${templateLocale === "en" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
            >
              EN
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {selected.isCustom ? (isRo ? "Custom" : "Custom") : (isRo ? "Default" : "Default")}
            </span>
          </div>
        </div>

        <form key={`form-${selected.key}-${templateLocale}`} action={saveAction} className="grid gap-3">
          <input type="hidden" name="key" value={selected.key} />
          <input type="hidden" name="locale" value={templateLocale} />
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">{isRo ? "Subiect" : "Subject"}</span>
            <input name="subject" defaultValue={selected.subject} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">{isRo ? "Text (plain)" : "Text (plain)"}</span>
            <textarea name="textBody" rows={8} defaultValue={selected.textBody} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">{isRo ? "HTML (optional)" : "HTML (optional)"}</span>
            <textarea name="htmlBody" rows={10} defaultValue={selected.htmlBody} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono" />
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="isEnabled" defaultChecked={selected.isEnabled} />
            {isRo ? "Template activ" : "Template enabled"}
          </label>
          <p className="text-xs text-slate-500">
            {isRo ? "Placeholders disponibile: " : "Available placeholders: "}
            <code>
              {selectedMeta.placeholders.length
                ? selectedMeta.placeholders.map((item) => `{{${item}}}`).join(", ")
                : "-"}
            </code>
          </p>
          <button className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            {isRo ? "Salveaza template" : "Save template"}
          </button>
        </form>
      </section>
    </div>
  );
}
