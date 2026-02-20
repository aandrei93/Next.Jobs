"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";

type ProfileSecurityFormProps = {
  locale: "ro" | "en";
  currentEmail: string;
  action: (formData: FormData) => void;
};

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function PasswordInput({
  name,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  shown,
  onToggle,
}: {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        name={name}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        type={shown ? "text" : "password"}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Toggle password visibility"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function ProfileSecurityForm({ locale, currentEmail, action }: ProfileSecurityFormProps) {
  const isRo = locale === "ro";
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const strengthLabel = isRo
    ? ["Foarte slaba", "Slaba", "Medie", "Buna", "Foarte buna", "Excelenta"][strength]
    : ["Very weak", "Weak", "Medium", "Good", "Very good", "Excellent"][strength];
  const strengthWidth = `${Math.max(8, (strength / 5) * 100)}%`;
  const strengthColor =
    strength <= 1 ? "bg-red-500" : strength <= 2 ? "bg-orange-500" : strength <= 3 ? "bg-amber-500" : strength <= 4 ? "bg-lime-500" : "bg-emerald-500";

  const checks = [
    { ok: newPassword.length >= 8, label: isRo ? "Minim 8 caractere" : "At least 8 characters" },
    { ok: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword), label: isRo ? "Litere mari si mici" : "Uppercase and lowercase letters" },
    { ok: /\d/.test(newPassword), label: isRo ? "Cel putin o cifra" : "At least one number" },
    { ok: /[^A-Za-z0-9]/.test(newPassword), label: isRo ? "Cel putin un simbol" : "At least one symbol" },
    { ok: newPassword.length > 0 && newPassword === confirmPassword, label: isRo ? "Parolele coincid" : "Passwords match" },
  ];

  return (
    <form action={action} className="mt-4 grid gap-3 md:grid-cols-2">
      <label className="space-y-1 md:col-span-2">
        <span className="text-xs font-medium text-slate-600">{isRo ? "Parola curenta" : "Current password"}</span>
        <PasswordInput
          name="currentPassword"
          required
          shown={showCurrentPassword}
          onToggle={() => setShowCurrentPassword((value) => !value)}
        />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className="text-xs font-medium text-slate-600">{isRo ? "Email nou (optional)" : "New email (optional)"}</span>
        <input name="newEmail" type="email" placeholder={currentEmail} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-600">{isRo ? "Parola noua (optional)" : "New password (optional)"}</span>
        <PasswordInput
          name="newPassword"
          value={newPassword}
          onChange={setNewPassword}
          minLength={6}
          shown={showNewPassword}
          onToggle={() => setShowNewPassword((value) => !value)}
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-600">{isRo ? "Confirma parola noua" : "Confirm new password"}</span>
        <PasswordInput
          name="confirmPassword"
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={6}
          shown={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((value) => !value)}
        />
      </label>

      {newPassword.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{isRo ? "Putere parola" : "Password strength"}</span>
            <span className="font-semibold text-slate-800">{strengthLabel}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className={`h-full rounded-full transition-all duration-200 ${strengthColor}`} style={{ width: strengthWidth }} />
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-2">
                {check.ok ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <Circle className="size-3.5 text-slate-400" />}
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2">
        {isRo ? "Actualizeaza datele de conectare" : "Update login credentials"}
      </button>
    </form>
  );
}
