"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type LoginFormProps = {
  labels: {
    email: string;
    password: string;
    otp: string;
    requestOtp: string;
    otpSent: string;
    invalidCredentials: string;
    signingIn: string;
    submit: string;
  };
};

export function LoginForm({ labels }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  async function sendOtp(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const form = event.currentTarget.form;
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError(labels.invalidCredentials);
      return;
    }

    setSendingOtp(true);
    const response = await fetch("/api/auth/admin-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setSendingOtp(false);

    if (!response.ok) {
      setError(labels.invalidCredentials);
      return;
    }

    setInfo(labels.otpSent);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const otp = String(formData.get("otp") || "");

    const result = await signIn("credentials", {
      email,
      password,
      otp,
      redirect: false,
      callbackUrl: searchParams.get("callbackUrl") || "/admin",
    });

    setLoading(false);

    if (result?.error) {
      setError(labels.invalidCredentials);
      return;
    }

    router.push(result?.url || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="email" name="email" required placeholder={labels.email} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input type="password" name="password" required placeholder={labels.password} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input name="otp" placeholder={labels.otp} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button
          onClick={sendOtp}
          disabled={sendingOtp}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {sendingOtp ? labels.signingIn : labels.requestOtp}
        </button>
      </div>
      {info && <p className="text-sm text-emerald-700">{info}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
        {loading ? labels.signingIn : labels.submit}
      </button>
    </form>
  );
}
