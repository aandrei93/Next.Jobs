"use client";

import { useEffect } from "react";

function report(payload: Record<string, string>) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/errors/report", blob);
    return;
  }

  fetch("/api/errors/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
}

export function ClientErrorMonitor() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      report({
        message: event.message || "Unhandled client error",
        name: event.error?.name || "Error",
        stack: event.error?.stack || "",
        path: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        metadata: event.filename ? `source=${event.filename}:${event.lineno || 0}:${event.colno || 0}` : "",
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled promise rejection";

      report({
        message,
        name: reason instanceof Error ? reason.name : "UnhandledRejection",
        stack: reason instanceof Error ? reason.stack || "" : "",
        path: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
