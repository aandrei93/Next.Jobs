import Link from "next/link";
import { BadgeCheck, Building2, Clock3, Globe2, Hash, MapPin, Users } from "lucide-react";

type CompanyOverviewCardProps = {
  locale: "ro" | "en";
  company: {
    name: string;
    location: string;
    industry: string | null;
    companySize: string | null;
    foundedYear: number | null;
    verificationStatus: "PENDING_VERIFICATION" | "VERIFIED";
    registrationNumber: string | null;
    website: string | null;
    description: string | null;
  };
  jobLocation: string;
};

export function CompanyOverviewCard({ locale, company, jobLocation }: CompanyOverviewCardProps) {
  const isRo = locale === "ro";
  const companyDetails = [
    { label: isRo ? "Locatie" : "Location", value: company.location, icon: MapPin },
    { label: isRo ? "Industrie" : "Industry", value: company.industry || (isRo ? "Nespecificat" : "Not specified"), icon: Building2 },
    { label: isRo ? "Dimensiune companie" : "Company size", value: company.companySize || (isRo ? "Nespecificat" : "Not specified"), icon: Users },
    { label: isRo ? "An fondare" : "Founded", value: company.foundedYear ? String(company.foundedYear) : (isRo ? "Nespecificat" : "Not specified"), icon: Clock3 },
    {
      label: isRo ? "Verificare" : "Verification",
      value: company.verificationStatus === "VERIFIED" ? (isRo ? "Verificata" : "Verified") : (isRo ? "In verificare" : "Pending"),
      icon: BadgeCheck,
    },
    { label: isRo ? "Reg. comert" : "Registration no.", value: company.registrationNumber || "-", icon: Hash },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-7">
      <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900">{isRo ? "Despre companie" : "About the company"}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        {company.description ||
          (isRo ? `${company.name} recruteaza pentru extinderea echipei in ${jobLocation}.` : `${company.name} is hiring to grow the team in ${jobLocation}.`)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{company.name}</span>
        <Link
          href={`/jobs?city=${encodeURIComponent(company.location)}`}
          className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-medium text-cyan-800 hover:border-cyan-300"
        >
          <MapPin className="size-3.5" /> {company.location}
        </Link>
        <Link href={`/jobs?q=${encodeURIComponent(company.name)}`} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:border-slate-400">
          {isRo ? "Vezi joburile companiei" : "View company jobs"}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {companyDetails.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <item.icon className="size-3.5" /> {item.label}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>

      {company.website && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
          <Globe2 className="size-4 text-slate-500" />
          <a href={company.website} target="_blank" rel="noreferrer" className="text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">
            {company.website}
          </a>
        </p>
      )}
    </div>
  );
}
