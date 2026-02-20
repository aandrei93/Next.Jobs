"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type ConversationItem = {
  id: string;
  unread: boolean;
  jobTitle: string;
  companyName: string;
  latestMessage: string;
  latestSender: string;
  lastMessageAt: string;
};

type NotificationsDropdownProps = {
  locale: "ro" | "en";
  unreadBadge: string;
  unreadCount: number;
  conversations: ConversationItem[];
  inboxHref: string;
};

export function NotificationsDropdown({ locale, unreadBadge, unreadCount, conversations, inboxHref }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isRo = locale === "ro";

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (!root.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
        aria-label={isRo ? "Mesaje aplicatii" : "Application messages"}
        aria-expanded={open}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadBadge}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-11 z-50 w-80 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition duration-150 ease-out ${
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isRo ? "Conversatii recente" : "Recent conversations"}</p>
          {unreadCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              {isRo ? `${unreadBadge} noi` : `${unreadBadge} new`}
            </span>
          )}
        </div>
        <div className="mt-1 space-y-1">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={inboxHref} className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-medium text-slate-900">{conversation.jobTitle}</p>
                {conversation.unread && <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" />}
              </div>
              <p className="line-clamp-1 text-xs text-slate-500">{conversation.companyName}</p>
              <p className="mt-1 line-clamp-1 text-xs text-slate-700">
                <span className="font-medium">{conversation.latestSender}:</span> {conversation.latestMessage}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {new Date(conversation.lastMessageAt).toLocaleString(locale === "ro" ? "ro-RO" : "en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </Link>
          ))}
          {conversations.length === 0 && (
            <p className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500">
              {isRo ? "Nu exista conversatii inca." : "No conversations yet."}
            </p>
          )}
        </div>
        <Link href={inboxHref} className="mt-2 block rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-slate-700" onClick={() => setOpen(false)}>
          {isRo ? "Deschide inbox complet" : "Open full inbox"}
        </Link>
      </div>
    </div>
  );
}
