"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, Building2, FileText, UserCircle2, WalletCards } from "lucide-react";

type WorkspaceIcon = "overview" | "profile" | "resume" | "companies" | "jobs" | "applications";

type WorkspaceSidebarClientProps = {
  title: string;
  links: Array<{
    href: string;
    label: string;
    icon: WorkspaceIcon;
  }>;
};

const iconMap = {
  overview: BarChart3,
  profile: UserCircle2,
  resume: FileText,
  companies: Building2,
  jobs: BriefcaseBusiness,
  applications: WalletCards,
} as const;

export function WorkspaceSidebarClient({ title, links }: WorkspaceSidebarClientProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-xl border border-slate-200 bg-white p-4 md:w-56">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <nav className="flex flex-wrap gap-2 md:flex-col">
        {links.map((link) => {
          const active =
            link.icon === "overview"
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = iconMap[link.icon];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
