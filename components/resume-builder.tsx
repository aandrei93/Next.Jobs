"use client";

import { useMemo, useState } from "react";
import {
  availabilityLabel,
  normalizeAvailability,
  normalizeWorkAuthorization,
  normalizeWorkPreference,
  workAuthorizationLabel,
  workPreferenceLabel,
} from "@/lib/resume-options";

type ResumeData = {
  headline?: string | null;
  summary?: string | null;
  skills?: string | null;
  languages?: string | null;
  experience?: string | null;
  experienceYears?: string | null;
  education?: string | null;
  links?: string | null;
  desiredRole?: string | null;
  preferredCity?: string | null;
  phone?: string | null;
  availability?: string | null;
  workPreference?: string | null;
  workAuthorization?: string | null;
  drivingLicense?: string | null;
  hobbies?: string | null;
  expectedSalary?: string | null;
};

type ResumeBuilderProps = {
  locale: "ro" | "en";
  resume: ResumeData | null;
  profile: {
    city?: string | null;
    citizenship?: string | null;
    birthDate?: string | null;
    gender?: string | null;
  };
  updateAction: (formData: FormData) => void;
  labels: {
    title: string;
    quickApply: string;
    headline: string;
    desiredRole: string;
    preferredCity: string;
    summary: string;
    skills: string;
    experience: string;
    education: string;
    links: string;
    updateResume: string;
    resumePreview: string;
  };
};

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ResumeBuilder({ locale, resume, profile, updateAction, labels }: ResumeBuilderProps) {
  const [form, setForm] = useState({
    headline: resume?.headline ?? "",
    desiredRole: resume?.desiredRole ?? "",
    preferredCity: resume?.preferredCity ?? "",
    phone: resume?.phone ?? "",
    workPreference: normalizeWorkPreference(resume?.workPreference),
    workAuthorization: normalizeWorkAuthorization(resume?.workAuthorization),
    drivingLicense: resume?.drivingLicense ?? "",
    availability: normalizeAvailability(resume?.availability),
    expectedSalary: resume?.expectedSalary ?? "",
    summary: resume?.summary ?? "",
    skills: resume?.skills ?? "",
    languages: resume?.languages ?? "",
    experienceYears: resume?.experienceYears ?? "",
    experience: resume?.experience ?? "",
    education: resume?.education ?? "",
    hobbies: resume?.hobbies ?? "",
    links: resume?.links ?? "",
  });

  const fieldCount = Object.keys(form).length;
  const completedFields = useMemo(
    () => Object.values(form).filter((value) => value.trim().length > 0).length,
    [form]
  );
  const completionPercent = Math.round((completedFields / fieldCount) * 100);
  const skillTags = useMemo(() => splitCsv(form.skills).slice(0, 10), [form.skills]);
  const languageTags = useMemo(() => splitCsv(form.languages).slice(0, 8), [form.languages]);
  const isRo = locale === "ro";

  function updateField(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
        <h1 className="text-3xl font-bold">{labels.title}</h1>
        <p className="mt-2 text-sm text-slate-200">
          {isRo
            ? "Construieste un CV clar si complet ca sa aplici mai repede la anunturi."
            : "Build a clear, complete CV so you can apply faster to jobs."}
        </p>
        <div className="mt-4 max-w-xl">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-200">
            <span>{isRo ? "Completare profil" : "Profile completion"}</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-500/50">
            <div className="h-full rounded-full bg-amber-400 transition-all duration-300" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">{labels.quickApply}</h2>
          <form action={updateAction} className="mt-4 space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="headline" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.headline}</label>
                <p className="text-xs text-slate-500">{isRo ? "Titlul care apare primul pentru recruiteri. Exemplu: Senior Frontend Engineer." : "The headline recruiters see first. Example: Senior Frontend Engineer."}</p>
                <input id="headline" name="headline" value={form.headline} onChange={(event) => updateField("headline", event.target.value)} placeholder={labels.headline} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="desiredRole" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.desiredRole}</label>
                <p className="text-xs text-slate-500">{isRo ? "Rolul pe care il cauti activ in acest moment." : "The role you are currently targeting."}</p>
                <input id="desiredRole" name="desiredRole" value={form.desiredRole} onChange={(event) => updateField("desiredRole", event.target.value)} placeholder={labels.desiredRole} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="preferredCity" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.preferredCity}</label>
                <p className="text-xs text-slate-500">{isRo ? "Orasul preferat pentru joburi on-site sau hibrid." : "Preferred city for on-site or hybrid jobs."}</p>
                <input id="preferredCity" name="preferredCity" value={form.preferredCity} onChange={(event) => updateField("preferredCity", event.target.value)} placeholder={labels.preferredCity} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Telefon" : "Phone"}</label>
                <p className="text-xs text-slate-500">{isRo ? "Numar de contact pentru interviu rapid." : "Phone number for quick interview contact."}</p>
                <input id="phone" name="phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder={isRo ? "Ex: +40 7xx xxx xxx" : "Ex: +40 7xx xxx xxx"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor="workPreference" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Preferinta lucru" : "Work preference"}</label>
                <p className="text-xs text-slate-500">{isRo ? "Arata daca preferi remote, hibrid sau la birou." : "Shows whether you prefer remote, hybrid, or on-site."}</p>
                <select id="workPreference" name="workPreference" value={form.workPreference} onChange={(event) => updateField("workPreference", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">{isRo ? "Selecteaza" : "Select"}</option>
                  <option value="REMOTE">{isRo ? "Remote" : "Remote"}</option>
                  <option value="HYBRID">{isRo ? "Hibrid" : "Hybrid"}</option>
                  <option value="ONSITE">{isRo ? "La birou" : "On-site"}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="availability" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Disponibilitate" : "Availability"}</label>
                <p className="text-xs text-slate-500">{isRo ? "Cand poti incepe efectiv jobul." : "When you can effectively start the role."}</p>
                <select id="availability" name="availability" value={form.availability} onChange={(event) => updateField("availability", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">{isRo ? "Selecteaza" : "Select"}</option>
                  <option value="IMMEDIATELY">{isRo ? "Imediat" : "Immediately"}</option>
                  <option value="TWO_WEEKS">{isRo ? "2 saptamani" : "2 weeks"}</option>
                  <option value="ONE_MONTH">{isRo ? "1 luna" : "1 month"}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="expectedSalary" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Salariu dorit" : "Expected salary"}</label>
                <p className="text-xs text-slate-500">{isRo ? "Intervalul salarial orientativ pe care il vizezi." : "Indicative salary range you are targeting."}</p>
                <input id="expectedSalary" name="expectedSalary" value={form.expectedSalary} onChange={(event) => updateField("expectedSalary", event.target.value)} placeholder={isRo ? "Ex: 1800 EUR net" : "Ex: 1800 EUR net"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1 md:col-span-3">
                <label htmlFor="workAuthorization" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Work authorization" : "Work authorization"}</label>
                <p className="text-xs text-slate-500">{isRo ? "Important pentru companiile internationale: drept de munca local/UE/sponsorship." : "Important for international employers: local/EU work rights or sponsorship need."}</p>
                <select id="workAuthorization" name="workAuthorization" value={form.workAuthorization} onChange={(event) => updateField("workAuthorization", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">{isRo ? "Selecteaza" : "Select"}</option>
                  <option value="WORK_AUTH_RO">{isRo ? "Drept de munca in RO" : "Work authorized in RO"}</option>
                  <option value="WORK_AUTH_EU">{isRo ? "Drept de munca in UE" : "Work authorized in EU"}</option>
                  <option value="REQUIRES_SPONSORSHIP">{isRo ? "Necesita sponsorship" : "Requires sponsorship"}</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-3">
                <label htmlFor="drivingLicense" className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Permis de conducere" : "Driving license"}</label>
                <p className="text-xs text-slate-500">{isRo ? "Completeaza doar daca ai permis si categoria (ex: B, C)." : "Fill this only if you hold a license and include category (ex: B, C)."}</p>
                <input id="drivingLicense" name="drivingLicense" value={form.drivingLicense} onChange={(event) => updateField("drivingLicense", event.target.value)} placeholder={isRo ? "Ex: Categoria B" : "Ex: Category B"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">{isRo ? "Prezentare" : "Overview"}</h3>
              <p className="text-xs text-slate-500">{isRo ? "Scrie pe scurt valoarea ta profesionala, 4-6 fraze clare." : "Write your professional value briefly in 4-6 clear sentences."}</p>
              <textarea name="summary" rows={4} value={form.summary} onChange={(event) => updateField("summary", event.target.value)} placeholder={labels.summary} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p className="text-xs text-slate-500">{isRo ? "Skill-uri tehnice + business, separate prin virgula." : "Technical and business skills, comma separated."}</p>
              <textarea name="skills" rows={3} value={form.skills} onChange={(event) => updateField("skills", event.target.value)} placeholder={labels.skills} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p className="text-xs text-slate-500">{isRo ? "Limbi si nivel estimativ (ex: English C1, Romana nativ)." : "Languages and level estimate (ex: English C1, Romanian native)."}</p>
              <input name="languages" value={form.languages} onChange={(event) => updateField("languages", event.target.value)} placeholder={isRo ? "Limbi vorbite (separate prin virgula)" : "Languages (comma separated)"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">{isRo ? "Experienta si studii" : "Experience and education"}</h3>
              <p className="text-xs text-slate-500">{isRo ? "Ani relevanti de experienta pentru rolul dorit." : "Relevant years of experience for your target role."}</p>
              <input name="experienceYears" value={form.experienceYears} onChange={(event) => updateField("experienceYears", event.target.value)} placeholder={isRo ? "Ani de experienta (ex: 4+)" : "Years of experience (ex: 4+)"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p className="text-xs text-slate-500">{isRo ? "Experienta in format rezultat: actiune + impact + metrici." : "Use results format: action + impact + metrics."}</p>
              <textarea name="experience" rows={5} value={form.experience} onChange={(event) => updateField("experience", event.target.value)} placeholder={labels.experience} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p className="text-xs text-slate-500">{isRo ? "Studii relevante, specializare si eventuale cursuri-cheie." : "Relevant education, specialization, and key coursework."}</p>
              <textarea name="education" rows={4} value={form.education} onChange={(event) => updateField("education", event.target.value)} placeholder={labels.education} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p className="text-xs text-slate-500">{isRo ? "Hobby-uri/interese relevante care pot sustine profilul tau profesional." : "Relevant hobbies/interests that support your professional profile."}</p>
              <textarea name="hobbies" rows={3} value={form.hobbies} onChange={(event) => updateField("hobbies", event.target.value)} placeholder={isRo ? "Hobby-uri si interese" : "Hobbies and interests"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p className="text-xs text-slate-500">{isRo ? "Link-uri catre portofoliu, GitHub, LinkedIn, website personal." : "Links to portfolio, GitHub, LinkedIn, personal site."}</p>
              <input name="links" value={form.links} onChange={(event) => updateField("links", event.target.value)} placeholder={labels.links} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>

            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">{labels.updateResume}</button>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{labels.resumePreview}</h2>
            <p className="mt-2 text-base font-semibold text-slate-900">{form.headline || "-"}</p>
            <p className="text-sm text-slate-600">{form.desiredRole || "-"}</p>
            <p className="mt-1 text-xs text-slate-500">{form.preferredCity || "-"}</p>
            <div className="mt-2 grid gap-1 text-xs text-slate-600">
              <p><span className="font-medium text-slate-900">{isRo ? "Locatie profil" : "Profile location"}:</span> {profile.city || "-"}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Cetatenie" : "Citizenship"}:</span> {profile.citizenship || "-"}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Data nasterii" : "Date of birth"}:</span> {profile.birthDate || "-"}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Sex" : "Sex"}:</span> {profile.gender || "-"}</p>
            </div>
            <div className="mt-3 grid gap-1 text-xs text-slate-600">
              <p><span className="font-medium text-slate-900">{isRo ? "Telefon" : "Phone"}:</span> {form.phone || "-"}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Work mode" : "Work mode"}:</span> {workPreferenceLabel(form.workPreference, locale)}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Disponibil" : "Available"}:</span> {availabilityLabel(form.availability, locale)}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Salariu" : "Salary"}:</span> {form.expectedSalary || "-"}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Experienta" : "Experience"}:</span> {form.experienceYears || "-"}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Work authorization" : "Work authorization"}:</span> {workAuthorizationLabel(form.workAuthorization, locale)}</p>
              <p><span className="font-medium text-slate-900">{isRo ? "Permis" : "Driving license"}:</span> {form.drivingLicense || "-"}</p>
            </div>
            <p className="mt-3 text-sm text-slate-700">{form.summary || (isRo ? "Adauga un sumar clar despre experienta ta." : "Add a clear summary about your experience.")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {skillTags.length > 0 ? (
                skillTags.map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">{isRo ? "Nu ai skill-uri adaugate inca." : "No skills added yet."}</span>
              )}
            </div>
            {languageTags.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Limbi" : "Languages"}</p>
                <div className="flex flex-wrap gap-2">
                  {languageTags.map((language) => (
                    <span key={language} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {form.hobbies && (
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-700">
                <p><span className="font-medium text-slate-900">{isRo ? "Hobby-uri/interese" : "Hobbies/interests"}:</span> {form.hobbies}</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
