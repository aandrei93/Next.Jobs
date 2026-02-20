import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createCategorySuggestion, createMyCompany, deleteMyCompany, updateMyCompany } from "@/lib/user-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MinLengthTextarea } from "@/components/min-length-textarea";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "My companies" };

export default async function WorkspaceCompaniesPage() {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);

  if (!session) {
    return null;
  }
  if (session.user.accountType !== "employer") {
    redirect("/me/access-denied?required=employer");
  }

  const dict = await getDictionary(locale);
  const isRo = locale === "ro";

  const [companies, locationRows, categorySuggestions] = await Promise.all([
    prisma.company.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { jobs: true } } },
    }),
    prisma.company.findMany({
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
    }),
    prisma.categorySuggestion.findMany({
      where: { suggestedById: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { company: { select: { name: true } } },
      take: 20,
    }),
  ]);

  const locationSuggestions = locationRows.map((item) => item.location);
  const hasSuspendedCompany = companies.some((company) => company.isSuspended);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{dict.me.companies}</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Adauga companie" : "Add company"}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {isRo
            ? "Completeaza profilul companiei cat mai concret: domeniu, dimensiune, ce faceti, cui va adresati si ce tip de roluri recrutezi."
            : "Complete a concrete company profile: industry, size, what you do, target audience, and roles you usually hire for."}
        </p>
        {hasSuspendedCompany && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {isRo
              ? "Compania ta a fost suspendata. Nu poti adauga alte companii sau joburi. Contacteaza echipa de support."
              : "Your company has been suspended. You cannot add other companies or jobs. Contact the support team."}
          </div>
        )}
        <form action={createMyCompany} className="mt-4 grid gap-3 md:grid-cols-2">
          <fieldset disabled={hasSuspendedCompany} className="grid gap-3 md:col-span-2 md:grid-cols-2 disabled:opacity-60">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Nume companie" : "Company name"}</label>
              <input name="name" required placeholder={isRo ? "Ex: Northbridge AI" : "Ex: Northbridge AI"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{dict.jobs.location}</label>
              <input list="company-locations" name="location" required placeholder={isRo ? "Ex: Bucuresti, Romania" : "Ex: Bucharest, Romania"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Nr. inregistrare companie" : "Company registration number"}</label>
              <input name="registrationNumber" required placeholder={isRo ? "Ex: J40/1234/2020" : "Ex: J40/1234/2020"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "CUI / VAT (optional)" : "VAT / Tax ID (optional)"}</label>
              <input name="vatNumber" placeholder={isRo ? "Ex: RO12345678" : "Ex: RO12345678"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Industrie" : "Industry"}</label>
              <input name="industry" placeholder={isRo ? "Ex: IT Services" : "Ex: IT Services"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Marime companie" : "Company size"}</label>
              <select name="companySize" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">{isRo ? "Selecteaza" : "Select"}</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "An infiintare (optional)" : "Founded year (optional)"}</label>
              <input type="number" name="foundedYear" min={1800} max={2100} placeholder="2020" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Logo URL" : "Logo URL"}</label>
              <input name="logoUrl" placeholder={isRo ? "https://site.ro/logo.png" : "https://site.com/logo.png"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-slate-500">{isRo ? "Format recomandat: PNG/SVG cu fundal transparent." : "Recommended format: PNG/SVG with transparent background."}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Website oficial" : "Official website"}</label>
              <input name="website" placeholder={isRo ? "https://compania-ta.ro" : "https://your-company.com"} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-slate-500">{isRo ? "Adresa publica unde candidatii pot verifica firma." : "Public address where candidates can validate your company."}</p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Descriere companie" : "Company description"}</label>
              <MinLengthTextarea
                name="description"
                locale={locale}
                minLength={60}
                required
                rows={6}
                placeholder={
                  isRo
                    ? "Descrie pe scurt cine sunteti, ce produse/servicii oferiti, marimea echipei, tehnologiile folosite si mediul de lucru."
                    : "Briefly describe who you are, products/services, team size, technologies used, and work environment."
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                recommendationRo="Recomandat: domeniu, senioritate cautata, beneficii principale, model de lucru."
                recommendationEn="Recommended: industry, target seniority, key benefits, work model."
              />
            </div>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2">
              {isRo ? "Adauga companie" : "Add company"}
            </button>
          </fieldset>
          <datalist id="company-locations">
            {locationSuggestions.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Propune categorie noua" : "Suggest a new category"}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {isRo
            ? "Nu gasesti categoria potrivita pentru joburile tale? Propune una noua. Dupa aprobare admin, va deveni disponibila la publicare."
            : "Can't find the right category for your jobs? Suggest one. After admin approval, it becomes available for posting."}
        </p>
        <form action={createCategorySuggestion} className="mt-4 grid gap-3 md:grid-cols-2">
          <fieldset disabled={hasSuspendedCompany} className="grid gap-3 md:col-span-2 md:grid-cols-2 disabled:opacity-60">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Nume categorie propusa" : "Suggested category name"}</label>
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                placeholder={isRo ? "Ex: Cybersecurity" : "Ex: Cybersecurity"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Companie asociata (optional)" : "Related company (optional)"}</label>
              <select name="companyId" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">{isRo ? "Neselectat" : "Not selected"}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Detalii (optional)" : "Details (optional)"}</label>
              <textarea
                name="details"
                rows={3}
                maxLength={600}
                placeholder={isRo ? "De ce ai nevoie de aceasta categorie? Ce tip de roluri vei publica?" : "Why do you need this category? What roles will you post?"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2">
              {isRo ? "Trimite propunerea" : "Send proposal"}
            </button>
          </fieldset>
        </form>
        <div className="mt-4 space-y-2">
          {categorySuggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <p className="font-medium text-slate-900">
                {suggestion.name}{" "}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${suggestion.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : suggestion.status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>
                  {suggestion.status}
                </span>
              </p>
              {suggestion.company ? <p className="text-xs text-slate-500">{isRo ? "Companie" : "Company"}: {suggestion.company.name}</p> : null}
              {suggestion.adminNote ? <p className="mt-1 text-xs text-slate-600">{isRo ? "Nota admin" : "Admin note"}: {suggestion.adminNote}</p> : null}
            </article>
          ))}
          {categorySuggestions.length === 0 ? (
            <p className="text-sm text-slate-600">{isRo ? "Nu ai propuneri trimise inca." : "You have no proposals yet."}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Companii existente" : "Existing companies"}</h2>
        <div className="mt-4 space-y-4">
          {companies.map((company) => (
            <article key={company.id} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{company.name}</p>
                <p className="text-xs text-slate-500">{company._count.jobs} {dict.admin.jobs.toLowerCase()}</p>
              </div>
              <div className="mb-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 md:grid-cols-2">
                <p><span className="font-semibold text-slate-900">{isRo ? "Nr. inregistrare" : "Registration"}:</span> {company.registrationNumber || "-"}</p>
                <p><span className="font-semibold text-slate-900">{isRo ? "CUI / VAT" : "VAT / Tax ID"}:</span> {company.vatNumber || "-"}</p>
                <p><span className="font-semibold text-slate-900">{isRo ? "Industrie" : "Industry"}:</span> {company.industry || "-"}</p>
                <p><span className="font-semibold text-slate-900">{isRo ? "Marime" : "Size"}:</span> {company.companySize || "-"}</p>
                <p><span className="font-semibold text-slate-900">{isRo ? "An infiintare" : "Founded"}:</span> {company.foundedYear || "-"}</p>
              </div>
              {company.isSuspended && (
                <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-800">
                  {isRo ? "Companie suspendata" : "Company suspended"}
                </p>
              )}
              {!company.isSuspended && company.verificationStatus !== "VERIFIED" && (
                <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
                  {isRo ? "In verificare admin (nu poate publica joburi inca)" : "Pending admin verification (cannot post jobs yet)"}
                </p>
              )}
              {company.verificationStatus === "VERIFIED" && (
                <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
                  {isRo ? "Companie verificata" : "Verified company"}
                </p>
              )}

              <form action={updateMyCompany} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={company.id} />
                <input name="name" defaultValue={company.name} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input list="company-locations" name="location" defaultValue={company.location} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input name="registrationNumber" defaultValue={company.registrationNumber || ""} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input name="vatNumber" defaultValue={company.vatNumber || ""} placeholder={isRo ? "CUI / VAT" : "VAT / Tax ID"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input name="industry" defaultValue={company.industry || ""} placeholder={isRo ? "Industrie" : "Industry"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <select name="companySize" defaultValue={company.companySize || ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">{isRo ? "Marime companie" : "Company size"}</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
                <input type="number" name="foundedYear" min={1800} max={2100} defaultValue={company.foundedYear || ""} placeholder={isRo ? "An infiintare" : "Founded year"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input name="logoUrl" defaultValue={company.logoUrl || ""} placeholder="Logo URL" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input name="website" defaultValue={company.website || ""} placeholder="Website" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="md:col-span-2">
                  <MinLengthTextarea
                    name="description"
                    locale={locale}
                    minLength={60}
                    required
                    rows={6}
                    defaultValue={company.description || ""}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    recommendationRo="Recomandat: domeniu, senioritate cautata, beneficii principale, model de lucru."
                    recommendationEn="Recommended: industry, target seniority, key benefits, work model."
                  />
                </div>
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  {dict.admin.saveChanges}
                </button>
              </form>

              <form action={deleteMyCompany} className="mt-2">
                <input type="hidden" name="id" value={company.id} />
                <ConfirmSubmitButton
                  confirmMessage={isRo ? "Sigur vrei sa stergi compania?" : "Are you sure you want to delete this company?"}
                  className="rounded-md border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                >
                  {dict.admin.delete}
                </ConfirmSubmitButton>
              </form>
            </article>
          ))}
          {companies.length === 0 && <p className="text-sm text-slate-600">{dict.admin.noCompanies}</p>}
        </div>
      </section>
    </div>
  );
}

