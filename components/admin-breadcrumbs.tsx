"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  FolderKanban,
  Home,
  NotebookTabs,
  Settings2,
  Shield,
  Languages,
  Mail,
  Images,
  Users,
  Bug,
} from "lucide-react";

type AdminBreadcrumbsProps = {
  locale: "ro" | "en";
};

type CrumbItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

function mapSegment(segment: string, locale: "ro" | "en"): Omit<CrumbItem, "href"> {
  const isRo = locale === "ro";
  switch (segment) {
    case "jobs":
      return { label: isRo ? "Joburi" : "Jobs", icon: BriefcaseBusiness };
    case "companies":
      return { label: isRo ? "Companii" : "Companies", icon: Building2 };
    case "categories":
      return { label: isRo ? "Categorii" : "Categories", icon: FolderKanban };
    case "applications":
      return { label: isRo ? "Aplicatii" : "Applications", icon: Shield };
    case "users":
      return { label: isRo ? "Utilizatori" : "Users", icon: Users };
    case "errors":
      return { label: isRo ? "Jurnal erori" : "Error logs", icon: Bug };
    case "settings":
      return { label: isRo ? "Setari" : "Settings", icon: Settings2 };
    case "translations":
      return { label: isRo ? "Traduceri" : "Translations", icon: Languages };
    case "email-templates":
      return { label: isRo ? "Template-uri Email" : "Email templates", icon: Mail };
    case "media":
      return { label: isRo ? "Media Library" : "Media library", icon: Images };
    case "release-notes":
      return { label: isRo ? "Release Notes" : "Release Notes", icon: NotebookTabs };
    default:
      return { label: isRo ? "Detalii" : "Details", icon: BriefcaseBusiness };
  }
}

export function AdminBreadcrumbs({ locale }: AdminBreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length || segments[0] !== "admin") {
    return null;
  }

  const crumbs: CrumbItem[] = [
    { href: "/admin", label: locale === "ro" ? "Admin" : "Admin", icon: Home },
  ];

  let current = "/admin";
  for (let i = 1; i < segments.length; i += 1) {
    current += `/${segments[i]}`;
    const mapped = mapSegment(segments[i], locale);
    crumbs.push({ href: current, label: mapped.label, icon: mapped.icon });
  }

  return (
    <nav aria-label="Breadcrumb" className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
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
