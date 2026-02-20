"use client";

import { useEffect } from "react";

export default function GlobalError({
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
        message: error.message || "Unhandled global error",
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
    <html lang="en">
      <body className="bg-slate-100 text-slate-900">
        <main className="w-full px-4 py-10">
          <section className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-600">Critical error</p>
            <h1 className="mt-2 text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              We logged this issue. Please retry. If this keeps happening, contact support.
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
      </body>
    </html>
  );
}
