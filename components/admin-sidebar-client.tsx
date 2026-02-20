"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  FolderKanban,
  NotebookTabs,
  Settings2,
  Shield,
  Users,
  SlidersHorizontal,
  Languages,
  Mail,
  Images,
  Bug,
  UserRound,
  Handshake,
  Archive,
  ShieldAlert,
  ScanSearch,
} from "lucide-react";

type AdminNavLink = {
  href: string;
  label: string;
  badge?: string;
  icon?:
    | "overview"
    | "jobs"
    | "companies"
    | "categories"
    | "applications"
    | "users"
    | "errors"
    | "releaseNotes"
    | "settings"
    | "candidate"
    | "employer"
    | "trash"
    | "alerts"
    | "audit";
};

type AdminNavGroup = {
  title: string;
  links: AdminNavLink[];
};

type AdminSidebarClientProps = {
  groups: AdminNavGroup[];
  platformSettingsLabel: string;
  translationsLabel: string;
  emailTemplatesLabel: string;
  mediaLibraryLabel: string;
};

function linkClass(active: boolean) {
  return `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
  }`;
}

function SidebarIcon({ icon }: { icon?: AdminNavLink["icon"] }) {
  if (icon === "overview") return <BarChart3 className="size-4" />;
  if (icon === "jobs") return <BriefcaseBusiness className="size-4" />;
  if (icon === "companies") return <Building2 className="size-4" />;
  if (icon === "categories") return <FolderKanban className="size-4" />;
  if (icon === "applications") return <Shield className="size-4" />;
  if (icon === "users") return <Users className="size-4" />;
  if (icon === "errors") return <Bug className="size-4" />;
  if (icon === "settings") return <Settings2 className="size-4" />;
  if (icon === "releaseNotes") return <NotebookTabs className="size-4" />;
  if (icon === "candidate") return <UserRound className="size-4" />;
  if (icon === "employer") return <Handshake className="size-4" />;
  if (icon === "trash") return <Archive className="size-4" />;
  if (icon === "alerts") return <ShieldAlert className="size-4" />;
  if (icon === "audit") return <ScanSearch className="size-4" />;
  return null;
}

export function AdminSidebarClient({
  groups,
  platformSettingsLabel,
  translationsLabel,
  emailTemplatesLabel,
  mediaLibraryLabel,
}: AdminSidebarClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const SETTINGS_COLLAPSE_KEY = "admin_settings_expanded";
  const [settingsExpanded, setSettingsExpanded] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    try {
      const saved = window.sessionStorage.getItem(SETTINGS_COLLAPSE_KEY);
      if (saved === "0") return false;
      if (saved === "1") return true;
    } catch {
      // Ignore sessionStorage access issues and keep default.
    }

    return true;
  });
  const settingsLinks = [
    { href: "/admin/settings", label: platformSettingsLabel, icon: SlidersHorizontal },
    { href: "/admin/settings/translations", label: translationsLabel, icon: Languages },
    { href: "/admin/settings/email-templates", label: emailTemplatesLabel, icon: Mail },
    { href: "/admin/settings/media", label: mediaLibraryLabel, icon: Images },
  ] as const;

  useEffect(() => {
    try {
      sessionStorage.setItem(SETTINGS_COLLAPSE_KEY, settingsExpanded ? "1" : "0");
    } catch {
      // Ignore sessionStorage write issues.
    }
  }, [settingsExpanded]);

  function isLinkActive(href: string) {
    const [pathOnly, query] = href.split("?");
    const pathMatch = pathOnly === "/admin" ? pathname === "/admin" : pathname.startsWith(pathOnly);
    if (!pathMatch) {
      return false;
    }
    if (!query) {
      return true;
    }

    const expectedParams = new URLSearchParams(query);
    for (const [key, value] of expectedParams.entries()) {
      if (searchParams.get(key) !== value) {
        return false;
      }
    }
    return true;
  }

  return (
    <aside className="w-full rounded-xl border border-slate-200 bg-white p-4 md:w-64">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
      <nav className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{group.title}</p>
            <div className="flex flex-wrap gap-2 md:flex-col">
              {group.links.map((link) => {
                const active = isLinkActive(link.href);
                if (link.href === "/admin/settings") {
                  return (
                    <div key={link.href} className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Link href={link.href} className={`${linkClass(active)} flex-1`}>
                          <SidebarIcon icon={link.icon} />
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSettingsExpanded((prev) => !prev)}
                          className={`inline-flex items-center rounded-lg border px-2 py-2 transition ${
                            active ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                          aria-label="Toggle settings submenu"
                        >
                          <ChevronDown className={`size-4 transition ${settingsExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                      <div className={`overflow-hidden transition-all ${settingsExpanded ? "max-h-96" : "max-h-0"}`}>
                        <div className="space-y-1 border-l border-slate-200 pl-2">
                          {settingsLinks.map((item) => {
                            const Icon = item.icon;
                            const itemActive = pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                                  itemActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                <Icon className="size-4" />
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <Link key={link.href} href={link.href} className={linkClass(active)}>
                    <SidebarIcon icon={link.icon} />
                    <span className="flex-1">{link.label}</span>
                    {link.badge ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {link.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
