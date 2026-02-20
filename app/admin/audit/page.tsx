import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Audit" };

function safeParse(json: string | null) {
  if (!json) return null;
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectDiff(
  beforeValue: unknown,
  afterValue: unknown,
  prefix = ""
): Array<{ key: string; before: unknown; after: unknown }> {
  if (isPlainObject(beforeValue) && isPlainObject(afterValue)) {
    const keys = new Set([...Object.keys(beforeValue), ...Object.keys(afterValue)]);
    const entries: Array<{ key: string; before: unknown; after: unknown }> = [];

    for (const key of keys) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      entries.push(...collectDiff(beforeValue[key], afterValue[key], nextPrefix));
    }

    return entries;
  }

  const left = JSON.stringify(beforeValue);
  const right = JSON.stringify(afterValue);
  if (left !== right) {
    return [{ key: prefix || "(root)", before: beforeValue, after: afterValue }];
  }

  return [];
}

export default async function AdminAuditPage() {
  const locale = await getLocale();
  const isRo = locale === "ro";

  const logs = await prisma.adminChangeLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      admin: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isRo ? "Audit schimbari" : "Change audit"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Istoric complet al schimbarilor critice facute din Admin." : "Complete history of critical changes made from Admin."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-3">
          {logs.map((log) => (
            <article key={log.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {log.action} - {log.entityType}
                  {log.entityId ? `:${log.entityId}` : ""}
                </p>
                <span className="text-xs text-slate-500">{log.createdAt.toLocaleString(isRo ? "ro-RO" : "en-GB")}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {isRo ? "Admin" : "Admin"}: {log.admin.name} ({log.admin.email})
              </p>
              <details className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                <summary className="cursor-pointer text-xs font-medium">{isRo ? "Vezi diff" : "View diff"}</summary>
                {(() => {
                  const before = safeParse(log.beforeJson);
                  const after = safeParse(log.afterJson);
                  const changes = collectDiff(before, after);

                  if (changes.length === 0) {
                    return <p className="mt-2 text-xs text-slate-600">{isRo ? "Nu exista diferente detectate." : "No differences detected."}</p>;
                  }

                  return (
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-slate-500">
                            <th className="px-2 py-1">{isRo ? "Camp" : "Field"}</th>
                            <th className="px-2 py-1">{isRo ? "Inainte" : "Before"}</th>
                            <th className="px-2 py-1">{isRo ? "Dupa" : "After"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changes.map((entry) => (
                            <tr key={entry.key} className="border-b border-slate-100 align-top">
                              <td className="px-2 py-1 font-medium text-slate-800">{entry.key}</td>
                              <td className="px-2 py-1 text-slate-700">{JSON.stringify(entry.before) ?? "-"}</td>
                              <td className="px-2 py-1 text-slate-700">{JSON.stringify(entry.after) ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </details>
            </article>
          ))}
          {logs.length === 0 ? <p className="text-sm text-slate-600">{isRo ? "Nu exista intrari de audit." : "No audit entries yet."}</p> : null}
        </div>
      </section>
    </div>
  );
}
