"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { BriefcaseBusiness, ChevronRight, FileText, Home, LayoutGrid, ScrollText, Settings, UserCircle2 } from "lucide-react";

type SiteBreadcrumbsProps = {
  locale: "ro" | "en";
};

type CrumbItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const HIDDEN_PREFIXES = ["/admin", "/api", "/register"];
const HIDDEN_PATHS = ["/", "/login", "/forgot-password", "/reset-password", "/verify-email", "/privacy"];

function mapSegment(segment: string, locale: "ro" | "en"): Omit<CrumbItem, "href"> {
  const isRo = locale === "ro";
  switch (segment) {
    case "jobs":
      return { label: isRo ? "Joburi" : "Jobs", icon: BriefcaseBusiness };
    case "saved-jobs":
      return { label: isRo ? "Joburi salvate" : "Saved jobs", icon: ScrollText };
    case "changelog":
      return { label: isRo ? "Release Notes" : "Release Notes", icon: ScrollText };
    case "me":
      return { label: isRo ? "Workspace" : "Workspace", icon: LayoutGrid };
    case "candidate":
      return { label: isRo ? "Candidat" : "Candidate", icon: UserCircle2 };
    case "employer":
      return { label: isRo ? "Angajator" : "Employer", icon: BriefcaseBusiness };
    case "profile":
      return { label: isRo ? "Profil" : "Profile", icon: UserCircle2 };
    case "resume":
      return { label: isRo ? "CV" : "Resume", icon: FileText };
    case "companies":
      return { label: isRo ? "Companii" : "Companies", icon: BriefcaseBusiness };
    case "applications":
      return { label: isRo ? "Aplicatii" : "Applications", icon: FileText };
    case "settings":
      return { label: isRo ? "Setari" : "Settings", icon: Settings };
    default:
      return { label: isRo ? "Detalii" : "Details", icon: FileText };
  }
}

export function SiteBreadcrumbs({ locale }: SiteBreadcrumbsProps) {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname) || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return null;
  }

  const crumbs: CrumbItem[] = [{ href: "/", label: locale === "ro" ? "Acasa" : "Home", icon: Home }];

  let current = "";
  for (let i = 0; i < segments.length; i += 1) {
    current += `/${segments[i]}`;
    const mapped = mapSegment(segments[i], locale);
    crumbs.push({ href: current, label: mapped.label, icon: mapped.icon });
  }

  return (
    <nav data-site-breadcrumbs aria-label="Breadcrumb" className="w-full px-[var(--layout-gutter)] pt-3">
      <ol className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.href}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3.5 text-slate-400" /> : null}
              {isLast ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                  <crumb.icon className="size-3.5" />
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-slate-100 hover:text-slate-900">
                  <crumb.icon className="size-3.5" />
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

