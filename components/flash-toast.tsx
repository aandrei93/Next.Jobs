"use client";

import { useCallback, useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FlashToastProps = {
  messages: {
    saved: string;
    unsaved: string;
    applied: string;
    applyError: string;
    adminSuccess: string;
    adminError: string;
    resumeSaved: string;
    successTitle: string;
    errorTitle: string;
    closeLabel: string;
  };
};

const validToastCodes = ["saved", "unsaved", "applied", "apply_error", "admin_success", "admin_error", "resume_saved"] as const;
type ToastCode = (typeof validToastCodes)[number];

function isToastCode(value: string): value is ToastCode {
  return validToastCodes.includes(value as ToastCode);
}

export function FlashToast({ messages }: FlashToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toastParam = searchParams.get("toast");

  const lookup = {
    saved: messages.saved,
    unsaved: messages.unsaved,
    applied: messages.applied,
    apply_error: messages.applyError,
    admin_success: messages.adminSuccess,
    admin_error: messages.adminError,
    resume_saved: messages.resumeSaved,
  } as const;

  const toastCode = toastParam && isToastCode(toastParam) ? toastParam : null;
  const text = toastCode ? lookup[toastCode] : null;
  const isError = toastCode === "apply_error" || toastCode === "admin_error";
  const title = isError ? messages.errorTitle : messages.successTitle;

  const clearToast = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!toastCode) {
      return;
    }

    const timer = setTimeout(() => {
      clearToast();
    }, 3200);

    return () => clearTimeout(timer);
  }, [clearToast, toastCode]);

  if (!text) {
    return null;
  }

  return (
    <div
      className={`fixed right-4 bottom-4 z-[120] w-[min(92vw,380px)] overflow-hidden animate-[toastIn_200ms_ease-out] rounded-xl border bg-white shadow-xl ${
        isError ? "border-rose-200" : "border-emerald-200"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`mt-0.5 ${isError ? "text-rose-600" : "text-emerald-600"}`}>
          {isError ? <AlertCircle className="size-5" /> : <CheckCircle2 className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
          <p className="mt-0.5 text-sm text-slate-800">{text}</p>
        </div>
        <button
          type="button"
          onClick={clearToast}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label={messages.closeLabel}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className={`h-0.5 w-full ${isError ? "bg-rose-100" : "bg-emerald-100"}`}>
        <div
          className={`h-full origin-left animate-[flashToastBar_3.2s_linear] ${isError ? "bg-rose-500" : "bg-emerald-500"}`}
        />
      </div>
    </div>
  );
}
