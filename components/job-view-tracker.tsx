"use client";

import { useEffect } from "react";

type JobViewTrackerProps = {
  jobId: string;
};

export function JobViewTracker({ jobId }: JobViewTrackerProps) {
  useEffect(() => {
    if (!jobId) {
      return;
    }

    const key = `job-viewed-${jobId}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(key)) {
      return;
    }

    fetch("/api/jobs/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }).catch(() => undefined);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(key, "1");
    }
  }, [jobId]);

  return null;
}
