type KeyPointsPanelProps = {
  locale: "ro" | "en";
  title: string;
  items: string[];
};

export function KeyPointsPanel({ locale, title, items }: KeyPointsPanelProps) {
  if (items.length === 0) {
    return null;
  }

  const keyPointTitles =
    locale === "ro"
      ? ["Responsabilitate principala", "Colaborare", "Optimizare", "Comunicare", "Livrare"]
      : ["Core responsibility", "Collaboration", "Optimization", "Communication", "Delivery"];

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item, index) => (
          <article key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {(keyPointTitles[index] || (locale === "ro" ? "Punct cheie" : "Key point"))} #{index + 1}
            </p>
            <p className="mt-1 text-sm text-slate-700">{item}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
