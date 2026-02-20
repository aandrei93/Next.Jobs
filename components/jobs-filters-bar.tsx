"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Clock, MapPin, Search, SlidersHorizontal, UserRound, X } from "lucide-react";
import { EmploymentType } from "@prisma/client";
import { buildJobsQuery, JobsSort, ParsedJobsFilters } from "@/lib/jobs-query";

export type JobsFiltersLabels = {
  localeReset: string;
  keywords: string;
  location: string;
  sort: string;
  searchPlaceholder: string;
  locationPlaceholder: string;
  quickFilters: string;
  fullTime: string;
  contract: string;
  remoteOnly: string;
  clearAll: string;
  filterButton: string;
  done: string;
  liveUpdate: string;
  allFilters: string;
  employmentType: string;
  allCities: string;
  allCategories: string;
  posted: string;
  seniority: string;
  postedAny: string;
  posted24h: string;
  posted7d: string;
  posted30d: string;
  seniorityAny: string;
  seniorityEntry: string;
  seniorityMid: string;
  senioritySenior: string;
  seniorityLead: string;
  workMode: string;
  sortNewest: string;
  sortOldest: string;
  sortSalaryDesc: string;
  sortSalaryAsc: string;
  employmentTypeLabels: Record<EmploymentType, string>;
};

type JobsFiltersBarProps = {
  initial: ParsedJobsFilters;
  locale: "ro" | "en";
  typeCounts: Record<EmploymentType, number>;
  cityOptions: Array<{ value: string; count: number }>;
  categoryOptions: Array<{ value: string; label: string; count: number }>;
  labels: JobsFiltersLabels;
  children: React.ReactNode;
};

export function JobsFiltersBar({ initial, locale, typeCounts, cityOptions, categoryOptions, labels, children }: JobsFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formatCount = (value: number) =>
    new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

  const [q, setQ] = useState(initial.q);
  const [location, setLocation] = useState(initial.location);
  const [city, setCity] = useState(initial.city);
  const [category, setCategory] = useState(initial.category);
  const [posted, setPosted] = useState(initial.posted);
  const [seniority, setSeniority] = useState(initial.seniority);
  const [remote, setRemote] = useState(initial.remote);
  const [selectedTypes, setSelectedTypes] = useState<EmploymentType[]>(initial.selectedTypes);
  const [sort, setSort] = useState<JobsSort>(initial.sort);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sortOptions: Array<{ value: JobsSort; label: string }> = [
    { value: "newest", label: labels.sortNewest },
    { value: "oldest", label: labels.sortOldest },
    { value: "salary_desc", label: labels.sortSalaryDesc },
    { value: "salary_asc", label: labels.sortSalaryAsc },
  ];

  const activeFilters: Array<{ label: string; onClear: () => void }> = [];
  if (q) activeFilters.push({ label: `${labels.keywords}: ${q}`, onClear: () => setQ("") });
  if (location) activeFilters.push({ label: `${labels.location}: ${location}`, onClear: () => setLocation("") });
  if (city) activeFilters.push({ label: `${labels.allCities}: ${city}`, onClear: () => setCity("") });
  if (category) {
    const match = categoryOptions.find((item) => item.value === category);
    activeFilters.push({ label: `${labels.allCategories}: ${match?.label ?? category}`, onClear: () => setCategory("") });
  }
  if (posted !== "any") activeFilters.push({ label: `${labels.posted}: ${posted}`, onClear: () => setPosted("any") });
  if (seniority !== "any") activeFilters.push({ label: `${labels.seniority}: ${seniority}`, onClear: () => setSeniority("any") });
  if (remote) activeFilters.push({ label: labels.remoteOnly, onClear: () => setRemote(false) });

  selectedTypes.forEach((item) => {
    activeFilters.push({
      label: labels.employmentTypeLabels[item],
      onClear: () => setSelectedTypes((prev) => prev.filter((value) => value !== item)),
    });
  });

  if (sort !== "newest") {
    const label = sortOptions.find((item) => item.value === sort)?.label || sort;
    activeFilters.push({ label: `${labels.sort}: ${label}`, onClear: () => setSort("newest") });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const query = buildJobsQuery(
        {
          q,
          location,
          city,
          category,
          posted,
          seniority,
          company: "",
          remote,
          selectedTypes,
          sort,
          page: 1,
        },
        { page: 1 }
      );

      const params = new URLSearchParams(query);
      const selectedJob = searchParams.get("job");
      if (selectedJob) {
        params.set("job", selectedJob);
      }

      const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(next, { scroll: false });
    }, 250);

    return () => clearTimeout(timer);
  }, [category, city, location, pathname, posted, q, remote, router, searchParams, selectedTypes, seniority, sort]);

  const filtersContent = (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="font-[var(--font-sora)] text-base font-semibold text-slate-900">{labels.allFilters}</h2>
        <Link href="/jobs" className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900">
          {labels.localeReset}
        </Link>
      </div>

        <div className="mt-5 space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{labels.keywords}</p>
          <input
            type="text"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{labels.location}</p>
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={labels.locationPlaceholder}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{labels.employmentType}</p>
          <div className="space-y-2">
            {Object.values(EmploymentType).map((item) => {
              const checked = selectedTypes.includes(item);

              return (
                <label key={item} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedTypes((prev) => (checked ? prev.filter((value) => value !== item) : [...prev, item]));
                      }}
                      className="accent-cyan-700"
                    />
                    {labels.employmentTypeLabels[item]}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{formatCount(typeCounts[item])}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{labels.workMode}</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={remote}
              onChange={(event) => setRemote(event.target.checked)}
              className="accent-cyan-700"
            />
            {labels.remoteOnly}
          </label>
        </div>
      </div>
    </>
  );

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.72)] backdrop-blur md:p-5">
        <div className="grid gap-2 lg:grid-cols-[0.9fr_0.9fr_0.7fr_0.8fr_0.9fr_auto]">
          <label className="rounded-xl border border-slate-300 bg-white px-4 py-2">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <MapPin className="size-3.5" /> {labels.allCities}
            </span>
            <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full bg-transparent text-sm text-slate-900 outline-none">
              <option value="">{labels.allCities}</option>
              {cityOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value} ({formatCount(item.count)})
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-xl border border-slate-300 bg-white px-4 py-2">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <Building2 className="size-3.5" /> {labels.employmentType}
            </span>
            <select
              value={selectedTypes[0] || ""}
              onChange={(event) => setSelectedTypes(event.target.value ? [event.target.value as EmploymentType] : [])}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            >
              <option value="">{labels.employmentType}</option>
              {Object.values(EmploymentType).map((item) => (
                <option key={item} value={item}>
                  {labels.employmentTypeLabels[item]} ({formatCount(typeCounts[item])})
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-xl border border-slate-300 bg-white px-4 py-2">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <Clock className="size-3.5" /> {labels.posted}
            </span>
            <select value={posted} onChange={(event) => setPosted(event.target.value as typeof posted)} className="w-full bg-transparent text-sm text-slate-900 outline-none">
              <option value="any">{labels.postedAny}</option>
              <option value="24h">{labels.posted24h}</option>
              <option value="7d">{labels.posted7d}</option>
              <option value="30d">{labels.posted30d}</option>
            </select>
          </label>

          <label className="rounded-xl border border-slate-300 bg-white px-4 py-2">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <UserRound className="size-3.5" /> {labels.seniority}
            </span>
            <select value={seniority} onChange={(event) => setSeniority(event.target.value as typeof seniority)} className="w-full bg-transparent text-sm text-slate-900 outline-none">
              <option value="any">{labels.seniorityAny}</option>
              <option value="entry">{labels.seniorityEntry}</option>
              <option value="mid">{labels.seniorityMid}</option>
              <option value="senior">{labels.senioritySenior}</option>
              <option value="lead">{labels.seniorityLead}</option>
            </select>
          </label>

          <label className="rounded-xl border border-slate-300 bg-white px-4 py-2">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <Search className="size-3.5" /> {labels.allCategories}
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            >
              <option value="">{labels.allCategories}</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({formatCount(option.count)})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <SlidersHorizontal className="size-4" /> {labels.filterButton}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{labels.quickFilters}</span>
          <button type="button" onClick={() => setSelectedTypes(["FULL_TIME"])} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 hover:bg-slate-200">
            {labels.fullTime}
          </button>
          <button type="button" onClick={() => setSelectedTypes(["CONTRACT"])} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 hover:bg-slate-200">
            {labels.contract}
          </button>
          <button type="button" onClick={() => setRemote(true)} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 hover:bg-slate-200">
            {labels.remoteOnly}
          </button>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setLocation("");
              setCity("");
              setCategory("");
              setPosted("any");
              setSeniority("any");
              setRemote(false);
              setSelectedTypes([]);
              setSort("newest");
            }}
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 hover:bg-slate-200"
          >
            {labels.clearAll}
          </button>
          <label className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1">
            <span className="mr-1 text-xs text-slate-500">{labels.sort}</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as JobsSort)} className="bg-transparent text-xs text-slate-700 outline-none">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-slate-500">{labels.liveUpdate}</span>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={filter.onClear}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-400"
              >
                {filter.label}
                <X className="size-3" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5">{children}</section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30" onClick={() => setDrawerOpen(false)}>
          <div
            className="ml-auto h-full w-[92%] max-w-md overflow-y-auto bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Building2 className="size-4" /> {labels.filterButton}
              </p>
              <button onClick={() => setDrawerOpen(false)} className="rounded-full border border-slate-300 p-1 text-slate-600">
                <X className="size-4" />
              </button>
            </div>
            {filtersContent}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              {labels.done}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
