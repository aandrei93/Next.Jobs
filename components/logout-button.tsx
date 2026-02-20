"use client";

import { signOut } from "next-auth/react";

type LogoutButtonProps = {
  label: string;
};

export function LogoutButton({ label }: LogoutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}
