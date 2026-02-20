"use client";

import { useMemo, useState } from "react";

type TranslationCatalogItem = {
  key: string;
  ro: string;
  en: string;
};

type OverrideMap = Record<string, string>;

type AdminTranslationsPanelProps = {
  isRo: boolean;
  catalog: TranslationCatalogItem[];
  overrides: OverrideMap;
  updateAction: (formData: FormData) => Promise<void>;
};

export function AdminTranslationsPanel({ isRo, catalog, overrides, updateAction }: AdminTranslationsPanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  function getCategoryKey(key: string) {
    if (key === "localeName" || key === "localeSwitchLabel") {
      return "locale";
    }
    const [root] = key.split(".");
    return root || "general";
  }

  const categories = useMemo(() => {
    const values = Array.from(new Set(catalog.map((item) => getCategoryKey(item.key))));
    const preferredOrder = ["locale", "nav", "common", "toast", "home", "jobs", "me", "admin", "login", "register"];
    return values.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);
      if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
      if (aIndex >= 0) return -1;
      if (bIndex >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [catalog]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of catalog) {
      const key = getCategoryKey(item.key);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      const inCategory = category === "all" ? true : getCategoryKey(item.key) === category;
      if (!inCategory) {
        return false;
      }
      if (!q) {
        return true;
      }
      const roOverride = overrides[`ro::${item.key}`] || "";
      const enOverride = overrides[`en::${item.key}`] || "";
      return (
        item.key.toLowerCase().includes(q) ||
        item.ro.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q) ||
        roOverride.toLowerCase().includes(q) ||
        enOverride.toLowerCase().includes(q)
      );
    });
  }, [catalog, overrides, query, category]);

  function categoryLabel(value: string) {
    if (value === "all") {
      return isRo ? "Toate" : "All";
    }
    if (value === "locale") return isRo ? "Limba & selector" : "Locale & switch";
    if (value === "nav") return isRo ? "Navigare" : "Navigation";
    if (value === "common") return isRo ? "Comune" : "Common";
    if (value === "toast") return isRo ? "Notificari" : "Toasts";
    if (value === "home") return isRo ? "Pagina principala" : "Homepage";
    if (value === "login") return isRo ? "Autentificare" : "Login";
    if (value === "register") return isRo ? "Inregistrare" : "Register";
    if (value === "admin") return "Admin";
    if (value === "me") return isRo ? "Spatiul meu" : "Workspace";
    if (value === "jobs") return isRo ? "Joburi" : "Jobs";
    return value;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{isRo ? "Traduceri platforma" : "Platform translations"}</h2>
          <p className="mt-1 text-xs text-slate-600">
            {isRo
              ? "Editeaza override-uri pentru cheile existente. Daca lasi campul gol, ramane traducerea implicita din cod."
              : "Edit overrides for existing keys. If you leave a field empty, the default code translation is used."}
          </p>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {isRo ? "Chei" : "Keys"}: {filtered.length} / {catalog.length}
        </p>
      </div>

      <div className="mt-3 space-y-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={isRo ? "Cauta dupa cheie sau text..." : "Search by key or text..."}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              category === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {categoryLabel("all")} ({catalog.length})
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                category === item ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {categoryLabel(item)} ({categoryCounts.get(item) || 0})
            </button>
          ))}
        </div>
      </div>

      <form action={updateAction} className="mt-4 space-y-3">
        <div className="max-h-[65vh] overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-3 py-2">Key</th>
                <th className="px-3 py-2">{isRo ? "Implicit RO" : "Base RO"}</th>
                <th className="px-3 py-2">{isRo ? "Override RO" : "Override RO"}</th>
                <th className="px-3 py-2">{isRo ? "Implicit EN" : "Base EN"}</th>
                <th className="px-3 py-2">{isRo ? "Override EN" : "Override EN"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.key} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700">{item.key}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{item.ro}</td>
                  <td className="px-3 py-2">
                    <textarea
                      name={`tr__ro__${item.key}`}
                      rows={2}
                      defaultValue={overrides[`ro::${item.key}`] || ""}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{item.en}</td>
                  <td className="px-3 py-2">
                    <textarea
                      name={`tr__en__${item.key}`}
                      rows={2}
                      defaultValue={overrides[`en::${item.key}`] || ""}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    {isRo ? "Nicio cheie gasita." : "No keys found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          {isRo ? "Salveaza traducerile" : "Save translations"}
        </button>
      </form>
    </section>
  );
}
