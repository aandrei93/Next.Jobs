"use client";

import { useEffect, useRef } from "react";

type ThreadMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
};

type ApplicationThreadProps = {
  locale: "ro" | "en";
  currentUserId: string;
  messages: ThreadMessage[];
  emptyLabel: string;
};

export function ApplicationThread({ locale, currentUserId, messages, emptyLabel }: ApplicationThreadProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = listRef.current;
    if (!root) {
      return;
    }
    root.scrollTop = root.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={listRef} className="max-h-56 space-y-2 overflow-y-auto pr-1">
      {messages.map((msg) => {
        const mine = msg.sender.id === currentUserId;
        return (
          <div key={msg.id} className={`rounded-lg px-3 py-2 text-sm ${mine ? "bg-slate-900 text-white" : "bg-white text-slate-800 border border-slate-200"}`}>
            <p className="font-medium">{msg.sender.name}</p>
            <p className="mt-1 whitespace-pre-wrap">{msg.content}</p>
            <p className={`mt-1 text-[11px] ${mine ? "text-slate-200" : "text-slate-500"}`}>
              {new Date(msg.createdAt).toLocaleString(locale === "ro" ? "ro-RO" : "en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        );
      })}
      {messages.length === 0 && <p className="text-xs text-slate-500">{emptyLabel}</p>}
    </div>
  );
}
