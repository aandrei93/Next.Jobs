"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { EmploymentType } from "@prisma/client";
import { relativeDate } from "@/lib/jobs-query";

type JobListItem = {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  isRemote: boolean;
  createdAt: string;
};

type JobsInfiniteListProps = {
  jobs: JobListItem[];
  selectedSlug: string;
  locale: "ro" | "en";
  baseQuery: string;
  labels: {
    remote: string;
  };
  employmentTypeLabels: Record<EmploymentType, string>;
};

const INITIAL_ITEMS = 12;
const INCREMENT = 10;

function buildJobHref(baseQuery: string, slug: string) {
  const params = new URLSearchParams(baseQuery);
  params.set("job", slug);
  return `/jobs?${params.toString()}`;
}

export function JobsInfiniteList({ jobs, selectedSlug, locale, baseQuery, labels, employmentTypeLabels }: JobsInfiniteListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;

    if (!root || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(jobs.length, current + INCREMENT));
        }
      },
      {
        root,
        threshold: 0.2,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [jobs.length]);

  return (
    <div ref={scrollRootRef} className="max-h-[72vh] space-y-2 overflow-y-auto pr-1">
      {jobs.slice(0, visibleCount).map((job) => {
        const active = selectedSlug === job.slug;

        return (
          <Link
            key={job.id}
            href={buildJobHref(baseQuery, job.slug)}
            className={`block rounded-2xl border p-3 transition ${
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <p className={`text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>{job.companyName} - {job.location}</p>
            <p className="mt-1 font-[var(--font-sora)] text-[15px] font-semibold leading-snug">{job.title}</p>
            <p className={`mt-2 text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
              {employmentTypeLabels[job.employmentType]} {job.isRemote ? `- ${labels.remote}` : ""}
            </p>
            <p className={`mt-2 inline-flex items-center gap-1 text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
              <Clock3 className="size-3" /> {relativeDate(new Date(job.createdAt), locale)}
            </p>
          </Link>
        );
      })}

      {visibleCount < jobs.length && <div ref={sentinelRef} className="h-8" />}
    </div>
  );
}
