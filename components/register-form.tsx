"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BriefcaseBusiness, UserRound } from "lucide-react";
import type { RegisterActionState } from "@/components/register-screen";

type RegisterFormProps = {
  locale: "ro" | "en";
  allowPublicRegistration: boolean;
  registerAction: (prevState: RegisterActionState, formData: FormData) => Promise<RegisterActionState>;
  initialAccountType?: "candidate" | "employer";
};

export function RegisterForm({ locale, allowPublicRegistration, registerAction, initialAccountType }: RegisterFormProps) {
  const isRo = locale === "ro";
  const initialValues: RegisterActionState["values"] = {
    name: "",
    accountType: initialAccountType || "candidate",
    email: "",
    password: "",
    citizenship: "",
    birthDate: "",
    companyName: "",
    companyCity: "",
    companyWebsite: "",
  };

  const [state, formAction, isPending] = useActionState(registerAction, {
    ok: false,
    error: "",
    values: initialValues,
    fieldErrors: {},
  });
  const [formValues, setFormValues] = useState(initialValues);
  const [accountType, setAccountType] = useState<"candidate" | "employer">(initialAccountType || "candidate");

  if (!allowPublicRegistration) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {isRo ? "Inregistrarea publica este dezactivata momentan." : "Public registration is currently disabled."}
      </div>
    );
  }

  const fieldError = (name: string) => state.fieldErrors[name]?.[0];

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      {state.error ? <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div> : null}

      <div className="md:col-span-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
          {isRo ? "Tip cont" : "Account type"}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setAccountType("candidate");
              setFormValues((prev) => ({ ...prev, accountType: "candidate" }));
            }}
            className={`rounded-xl border p-3 text-left transition ${
              accountType === "candidate" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
            }`}
          >
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <UserRound className="size-4" />
              {isRo ? "Candidat" : "Candidate"}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {isRo ? "Aplici la joburi si iti gestionezi CV-ul." : "Apply to jobs and manage your CV."}
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountType("employer");
              setFormValues((prev) => ({ ...prev, accountType: "employer" }));
            }}
            className={`rounded-xl border p-3 text-left transition ${
              accountType === "employer" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
            }`}
          >
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <BriefcaseBusiness className="size-4" />
              {isRo ? "Angajator" : "Employer"}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {isRo ? "Publici joburi si gestionezi aplicatiile." : "Publish jobs and manage applications."}
            </p>
          </button>
        </div>
        <input type="hidden" name="accountType" value={accountType} />
      </div>

      <div className="md:col-span-2 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-2">
        <div>
          <input
            name="name"
            required
            value={formValues.name}
            onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
            placeholder={isRo ? "Nume complet" : "Full name"}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          {fieldError("name") ? <p className="mt-1 text-xs text-rose-600">{fieldError("name")}</p> : null}
        </div>
        <div>
          <input
            type="email"
            name="email"
            required
            value={formValues.email}
            onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          {fieldError("email") ? <p className="mt-1 text-xs text-rose-600">{fieldError("email")}</p> : null}
        </div>
        <div className="md:col-span-2">
          <input
            type="password"
            name="password"
            required
            minLength={6}
            value={formValues.password}
            onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
            placeholder={isRo ? "Parola" : "Password"}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          {fieldError("password") ? <p className="mt-1 text-xs text-rose-600">{fieldError("password")}</p> : null}
        </div>
      </div>

      {accountType === "candidate" ? (
        <div className="md:col-span-2 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-800">
            {isRo ? "Date candidat" : "Candidate details"}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <input
                name="citizenship"
                value={formValues.citizenship}
                onChange={(event) => setFormValues((prev) => ({ ...prev, citizenship: event.target.value }))}
                placeholder={isRo ? "Nationalitate" : "Nationality"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              {fieldError("citizenship") ? <p className="mt-1 text-xs text-rose-600">{fieldError("citizenship")}</p> : null}
            </div>
            <div>
              <input
                type="date"
                name="birthDate"
                value={formValues.birthDate}
                onChange={(event) => setFormValues((prev) => ({ ...prev, birthDate: event.target.value }))}
                placeholder={isRo ? "Data nasterii" : "Birth date"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              {fieldError("birthDate") ? <p className="mt-1 text-xs text-rose-600">{fieldError("birthDate")}</p> : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="md:col-span-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-amber-800">
            {isRo ? "Date angajator" : "Employer details"}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <input
                name="companyName"
                required={accountType === "employer"}
                value={formValues.companyName}
                onChange={(event) => setFormValues((prev) => ({ ...prev, companyName: event.target.value }))}
                placeholder={isRo ? "Nume companie" : "Company name"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              {fieldError("companyName") ? <p className="mt-1 text-xs text-rose-600">{fieldError("companyName")}</p> : null}
            </div>
            <div>
              <input
                name="companyCity"
                required={accountType === "employer"}
                value={formValues.companyCity}
                onChange={(event) => setFormValues((prev) => ({ ...prev, companyCity: event.target.value }))}
                placeholder={isRo ? "Oras companie" : "Company city"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              {fieldError("companyCity") ? <p className="mt-1 text-xs text-rose-600">{fieldError("companyCity")}</p> : null}
            </div>
            <div className="md:col-span-2">
              <input
                name="companyWebsite"
                value={formValues.companyWebsite}
                onChange={(event) => setFormValues((prev) => ({ ...prev, companyWebsite: event.target.value }))}
                placeholder={isRo ? "Website companie (optional)" : "Company website (optional)"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              {fieldError("companyWebsite") ? <p className="mt-1 text-xs text-rose-600">{fieldError("companyWebsite")}</p> : null}
            </div>
          </div>
        </div>
      )}

      <label className="md:col-span-2 inline-flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="privacyAccepted" value="1" required className="mt-0.5 h-4 w-4 rounded border-slate-300" />
        <span>
          {isRo ? "Sunt de acord cu " : "I agree with the "}
          <Link href="/privacy" className="font-semibold text-cyan-700 hover:underline">
            {isRo ? "Politica de confidentialitate" : "Privacy Policy"}
          </Link>
        </span>
      </label>
      {fieldError("privacyAccepted") ? <p className="md:col-span-2 -mt-2 text-xs text-rose-600">{fieldError("privacyAccepted")}</p> : null}

      <button disabled={isPending} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2">
        {isPending ? (isRo ? "Se proceseaza..." : "Processing...") : isRo ? "Inregistrare" : "Register"}
      </button>
      <p className="md:col-span-2 text-sm text-slate-600">
        {isRo ? "Ai deja cont?" : "Already have an account?"}{" "}
        <Link href="/login" className="font-semibold text-slate-900">
          {isRo ? "Login" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
