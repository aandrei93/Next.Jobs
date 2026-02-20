"use client";

import { useMemo, useState } from "react";

type ProtectedEmailLinkProps = {
  encodedEmail: string;
  revealLabel: string;
};

function decodeEmail(encodedEmail: string) {
  return encodedEmail
    .split(".")
    .map((part) => String.fromCharCode(Number(part) - 7))
    .join("");
}

export function ProtectedEmailLink({ encodedEmail, revealLabel }: ProtectedEmailLinkProps) {
  const [revealed, setRevealed] = useState(false);
  const email = useMemo(() => decodeEmail(encodedEmail), [encodedEmail]);

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="underline underline-offset-2 hover:text-white"
      >
        {revealLabel}
      </button>
    );
  }

  return (
    <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-white">
      {email}
    </a>
  );
}

