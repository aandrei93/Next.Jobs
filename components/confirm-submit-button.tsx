"use client";

import type { ReactNode } from "react";
import type { FormHTMLAttributes } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  title?: string;
  ariaLabel?: string;
  secureDelete?: boolean;
  deleteKeywordPrompt?: string;
  passwordPrompt?: string;
  formAction?: FormHTMLAttributes<HTMLButtonElement>["action"];
  formNoValidate?: boolean;
  name?: string;
  value?: string;
};

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  title,
  ariaLabel,
  secureDelete = false,
  deleteKeywordPrompt = "Type DELETE to confirm:",
  passwordPrompt = "Confirm admin password:",
  formAction,
  formNoValidate,
  name,
  value,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      formAction={formAction}
      formNoValidate={formNoValidate}
      className={className}
      title={title}
      aria-label={ariaLabel}
      onClick={(event) => {
        const accepted = window.confirm(confirmMessage);
        if (!accepted) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (!secureDelete) {
          return;
        }

        const form = event.currentTarget.closest("form");
        if (!form) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const typed = window.prompt(deleteKeywordPrompt, "DELETE");
        if (!typed || typed.trim().toUpperCase() !== "DELETE") {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const password = window.prompt(passwordPrompt);
        if (!password) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const ensureHidden = (name: string, value: string) => {
          let input = form.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
          if (!input) {
            input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            form.appendChild(input);
          }
          input.value = value;
        };

        ensureHidden("confirmText", "DELETE");
        ensureHidden("adminPassword", password);
      }}
    >
      {children}
    </button>
  );
}
