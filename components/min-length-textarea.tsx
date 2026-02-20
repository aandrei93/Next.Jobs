"use client";

import { useMemo, useState } from "react";

type MinLengthTextareaProps = {
  name: string;
  locale: "ro" | "en";
  minLength: number;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  recommendationRo?: string;
  recommendationEn?: string;
};

export function MinLengthTextarea({
  name,
  locale,
  minLength,
  required = false,
  rows = 4,
  placeholder,
  defaultValue = "",
  className,
  recommendationRo,
  recommendationEn,
}: MinLengthTextareaProps) {
  const [value, setValue] = useState(defaultValue);
  const count = value.length;
  const remaining = Math.max(0, minLength - count);
  const valid = count >= minLength;

  const helperText = useMemo(() => {
    if (locale === "ro") {
      return valid
        ? `Perfect. Ai ${count} caractere (minim ${minLength}).`
        : `Mai ai nevoie de ${remaining} caractere (acum: ${count}, minim: ${minLength}).`;
    }
    return valid
      ? `Great. You have ${count} characters (minimum ${minLength}).`
      : `You need ${remaining} more characters (now: ${count}, min: ${minLength}).`;
  }, [count, locale, minLength, remaining, valid]);

  return (
    <div>
      <textarea
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        required={required}
        minLength={minLength}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
      <p className={`mt-1 text-xs ${valid ? "text-emerald-700" : "text-amber-700"}`}>{helperText}</p>
      {recommendationRo || recommendationEn ? (
        <p className="mt-1 text-xs text-slate-500">{locale === "ro" ? recommendationRo : recommendationEn}</p>
      ) : null}
    </div>
  );
}

