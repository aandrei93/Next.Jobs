"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";
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
  dialogTitle?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  invalidSecureDeleteMessage?: string;
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
  dialogTitle = "Confirm action",
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  invalidSecureDeleteMessage = "Confirmation is invalid. Type DELETE and provide your admin password.",
  formAction,
  formNoValidate,
  name,
  value,
}: ConfirmSubmitButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmTextValue, setConfirmTextValue] = useState("DELETE");
  const [adminPasswordValue, setAdminPasswordValue] = useState("");
  const [validationError, setValidationError] = useState("");

  const canConfirmSecure = useMemo(
    () => confirmTextValue.trim().toUpperCase() === "DELETE" && adminPasswordValue.trim().length >= 4,
    [confirmTextValue, adminPasswordValue]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  function closeDialog() {
    setOpen(false);
    setValidationError("");
    setConfirmTextValue("DELETE");
    setAdminPasswordValue("");
  }

  function ensureHidden(form: HTMLFormElement, inputName: string, inputValue: string) {
    let input = form.querySelector(`input[name="${inputName}"]`) as HTMLInputElement | null;
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = inputName;
      form.appendChild(input);
    }
    input.value = inputValue;
  }

  function submitForm() {
    const form = buttonRef.current?.closest("form");
    if (!form) {
      return;
    }

    if (secureDelete) {
      if (!canConfirmSecure) {
        setValidationError(invalidSecureDeleteMessage);
        return;
      }
      ensureHidden(form, "confirmText", "DELETE");
      ensureHidden(form, "adminPassword", adminPasswordValue.trim());
    }

    closeDialog();
    form.requestSubmit();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        name={name}
        value={value}
        formAction={formAction}
        formNoValidate={formNoValidate}
        className={className}
        title={title}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/55 p-4 pt-[10vh] backdrop-blur-[2px]">
              <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_40px_120px_-50px_rgba(2,6,23,0.8)]">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <AlertTriangle className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{dialogTitle}</h3>
                    <p className="mt-1 text-sm text-slate-600">{confirmMessage}</p>
                  </div>
                </div>

                {secureDelete ? (
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-700">{deleteKeywordPrompt}</span>
                      <input
                        value={confirmTextValue}
                        onChange={(event) => setConfirmTextValue(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:border-cyan-500 focus:ring-2"
                        placeholder="DELETE"
                        autoComplete="off"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-700">{passwordPrompt}</span>
                      <input
                        type="password"
                        value={adminPasswordValue}
                        onChange={(event) => setAdminPasswordValue(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:border-cyan-500 focus:ring-2"
                        placeholder="********"
                        autoComplete="current-password"
                      />
                    </label>
                    {validationError ? <p className="text-xs font-medium text-rose-700">{validationError}</p> : null}
                  </div>
                ) : null}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={submitForm}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500"
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
