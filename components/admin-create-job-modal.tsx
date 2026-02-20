"use client";

import { useMemo, useState } from "react";
import { EmploymentType, JobStatus } from "@prisma/client";
import { RichTextEditorField } from "@/components/rich-text-editor-field";
import { createJob } from "@/lib/admin-actions";
import { getEmploymentTypeLabels, getJobStatusLabels } from "@/lib/jobs-query";

type CompanyOption = {
  id: string;
  name: string;
  location: string;
  isSuspended: boolean;
  verificationStatus: "PENDING_VERIFICATION" | "VERIFIED";
};

type CategoryOption = {
  id: string;
  name: string;
};

type AdminCreateJobModalProps = {
  locale: "ro" | "en";
  companies: CompanyOption[];
  categories: CategoryOption[];
  locationSuggestions: string[];
};

export function AdminCreateJobModal({ locale, companies, categories, locationSuggestions }: AdminCreateJobModalProps) {
  const isRo = locale === "ro";
  const employmentTypeLabels = getEmploymentTypeLabels(locale);
  const jobStatusLabels = getJobStatusLabels(locale);
  const [open, setOpen] = useState(false);
  const activeCompanies = useMemo(
    () => companies.filter((company) => !company.isSuspended && company.verificationStatus === "VERIFIED"),
    [companies]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        {isRo ? "Adauga job (modal)" : "Add job (modal)"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="mx-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{isRo ? "Creare job in Admin" : "Create job in Admin"}</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                {isRo ? "Inchide" : "Close"}
              </button>
            </div>

            <form action={createJob} className="space-y-4">
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{isRo ? "Detalii rol" : "Role details"}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input name="title" required placeholder={isRo ? "Titlu job" : "Job title"} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  <input list="admin-modal-job-locations" name="location" required placeholder={isRo ? "Locatie" : "Location"} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  <RichTextEditorField
                    className="md:col-span-2"
                    name="summary"
                    required
                    rows={3}
                    label={isRo ? "Sumar" : "Summary"}
                    description={isRo ? "Text scurt pentru lista de joburi." : "Short text used in jobs listing."}
                    placeholder={isRo ? "Sumar" : "Summary"}
                  />
                  <RichTextEditorField
                    className="md:col-span-2"
                    name="description"
                    required
                    rows={8}
                    label={isRo ? "Descriere completa" : "Full description"}
                    description={isRo ? "Detalii complete pentru candidati." : "Full details for candidates."}
                    placeholder={isRo ? "Descriere completa" : "Full description"}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{isRo ? "Companie si parametri" : "Company and parameters"}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <select name="companyId" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="">{isRo ? "Companie" : "Company"}</option>
                    {activeCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <select name="categoryId" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="">{isRo ? "Categorie (optional)" : "Category (optional)"}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <select name="employmentType" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    {Object.values(EmploymentType).map((item) => (
                      <option key={item} value={item}>
                        {employmentTypeLabels[item]}
                      </option>
                    ))}
                  </select>
                  <select name="status" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    {Object.values(JobStatus).map((item) => (
                      <option key={item} value={item}>
                        {jobStatusLabels[item]}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{isRo ? "Compensare si publicare" : "Compensation and publishing"}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input type="number" min={0} name="salaryMin" placeholder={isRo ? "Salariu minim" : "Minimum salary"} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  <input type="number" min={0} name="salaryMax" placeholder={isRo ? "Salariu maxim" : "Maximum salary"} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  <select name="currency" defaultValue="EUR" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="EUR">{isRo ? "Euro (EUR)" : "Euro (EUR)"}</option>
                    <option value="USD">{isRo ? "Dolar american (USD)" : "US Dollar (USD)"}</option>
                    <option value="RON">{isRo ? "Leu romanesc (RON)" : "Romanian Leu (RON)"}</option>
                  </select>
                  <input type="date" name="expirationDate" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    <input type="checkbox" name="isRemote" /> {isRo ? "Remote" : "Remote"}
                  </label>
                </div>
              </section>

              <button className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                {isRo ? "Creeaza" : "Create"}
              </button>
              <datalist id="admin-modal-job-locations">
                {locationSuggestions.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
