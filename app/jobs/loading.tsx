export default function JobsLoading() {
  return (
    <main className="w-full animate-pulse px-[var(--layout-gutter)] py-8">
      <div className="h-36 rounded-3xl border border-slate-200 bg-white" />

      <section className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 lg:block">
          <div className="mb-4 h-5 w-24 rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-4/5 rounded bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
          </div>
        </aside>

        <div className="space-y-3">
          <div className="h-12 rounded-2xl border border-slate-200 bg-white" />
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-200" />
              <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-1/3 rounded bg-slate-200" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
