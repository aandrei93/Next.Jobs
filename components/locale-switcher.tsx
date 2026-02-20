"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n";

type LocaleSwitcherProps = {
  locale: Locale;
};

const localeItems: Array<{ value: Locale; icon: string; name: string }> = [
  { value: "ro", icon: "🇷🇴", name: "Romana" },
  { value: "en", icon: "🇬🇧", name: "English" },
];

export function LocaleSwitcher({ locale }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(nextLocale: Locale) {
    const query = searchParams.toString();
    const redirect = query ? `${pathname}?${query}` : pathname;
    window.location.assign(`/api/locale?locale=${nextLocale}&redirect=${encodeURIComponent(redirect)}`);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1">
      {localeItems.map((item) => {
        const active = item.value === locale;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            aria-label={item.name}
            title={item.name}
            className={`group relative inline-flex h-8 w-8 items-center justify-center rounded-full text-base transition ${
              active ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
