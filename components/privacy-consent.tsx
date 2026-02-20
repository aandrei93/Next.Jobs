"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Locale } from "@/lib/i18n";

type PrivacyConsentProps = {
  locale: Locale;
};

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

const CONSENT_KEY = "nextjobs_privacy_consent_v1";

function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (typeof parsed?.necessary !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(value: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
}

export function PrivacyConsent({ locale }: PrivacyConsentProps) {
  const isRo = locale === "ro";
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const existing = readConsent();
      if (existing) {
        setAnalytics(existing.analytics);
        setMarketing(existing.marketing);
        setOpen(false);
        setLoaded(true);
        return;
      }

      setOpen(true);
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!loaded) {
    return null;
  }

  function acceptAll() {
    writeConsent({ necessary: true, analytics: true, marketing: true, ts: Date.now() });
    setAnalytics(true);
    setMarketing(true);
    setOpen(false);
  }

  function rejectAll() {
    writeConsent({ necessary: true, analytics: false, marketing: false, ts: Date.now() });
    setAnalytics(false);
    setMarketing(false);
    setOpen(false);
  }

  function saveAndExit() {
    writeConsent({ necessary: true, analytics, marketing, ts: Date.now() });
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-2 left-2 z-[70] rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-cyan-700"
      >
        {isRo ? "Privacy" : "Privacy"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900">
                  {isRo ? "Pretuim confidentialitatea ta" : "We value your privacy"}
                </h2>
                <p className="mt-2 text-sm text-slate-700">
                  {isRo
                    ? "Folosim cookies si tehnologii similare pentru functionare, analiza si imbunatatirea experientei."
                    : "We use cookies and similar technologies for functionality, analytics, and experience improvements."}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{isRo ? "Necesare" : "Necessary"}</p>
                <span className="text-xs font-semibold text-emerald-700">{isRo ? "Mereu active" : "Always on"}</span>
              </div>
              <label className="flex items-center justify-between">
                <span>{isRo ? "Analitice" : "Analytics"}</span>
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between">
                <span>{isRo ? "Marketing" : "Marketing"}</span>
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                <Link href="/privacy" className="font-semibold underline underline-offset-2">
                  {isRo ? "Politica de confidentialitate" : "Privacy policy"}
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={rejectAll} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                  {isRo ? "Respinge tot" : "Reject all"}
                </button>
                <button type="button" onClick={acceptAll} className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-900 hover:bg-cyan-100">
                  {isRo ? "Accepta tot" : "Accept all"}
                </button>
                <button type="button" onClick={saveAndExit} className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600">
                  {isRo ? "Salveaza si inchide" : "Save & exit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
