"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || "Unhandled app error",
        name: error.name,
        stack: error.stack,
        digest: error.digest,
        path: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, [error]);

  return (
    <main className="w-full px-[var(--layout-gutter)] py-10">
      <section className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-600">Error</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          We logged this issue. Please retry, and contact support if it continues.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
