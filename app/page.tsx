import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, MapPin, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";
import { formatSalary } from "@/lib/utils";

export default async function HomePage() {
  const [locale, settings] = await Promise.all([
    getLocale(),
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
  ]);
  const featuredCount = Math.min(24, Math.max(4, Number((settings as { homeFeaturedJobsCount?: number }).homeFeaturedJobsCount || 8)));
  const [latestJobs, publishedSnapshot, companiesCount, categoriesCount, usersCount, publishedJobsCount, applicationsCount, viewsAggregate] = await Promise.all([
    prisma.job.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      },
      include: {
        company: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: featuredCount,
    }),
    prisma.job.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      },
      select: {
        location: true,
        category: { select: { name: true } },
      },
      take: 120,
    }),
    prisma.company.count(),
    prisma.category.count(),
    prisma.user.count(),
    prisma.job.count({
      where: {
        status: "PUBLISHED",
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      },
    }),
    prisma.application.count(),
    prisma.job.aggregate({ _sum: { viewsCount: true } }),
  ]);

  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const formatMetric = (value: number) => formatCompactMetric(value, locale);

  const highlights = [
    { label: dict.home.activeJobs, value: publishedJobsCount, tone: "border-cyan-200 bg-cyan-50 text-cyan-900" },
    { label: dict.home.companies, value: companiesCount, tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
    { label: dict.home.candidates, value: usersCount, tone: "border-amber-200 bg-amber-50 text-amber-900" },
    { label: dict.admin.categories, value: categoriesCount, tone: "border-slate-200 bg-slate-100 text-slate-800" },
  ];
  const totalViews = viewsAggregate._sum.viewsCount || 0;

  const cityMap = publishedSnapshot.reduce<Record<string, number>>((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {});

  const categoryMap = publishedSnapshot.reduce<Record<string, number>>((acc, item) => {
    if (!item.category?.name) {
      return acc;
    }
    acc[item.category.name] = (acc[item.category.name] || 0) + 1;
    return acc;
  }, {});

  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <main className="w-full space-y-8 px-[var(--layout-gutter)] py-8 md:space-y-10 md:py-10">
      <ScrollReveal as="section" className="relative overflow-hidden rounded-[2rem] border border-slate-200 shadow-[0_35px_90px_-60px_rgba(15,23,42,0.75)]">
        <Image
          src="/visuals/home-hero-team.jpg"
          alt="Professionals collaborating in office"
          width={1920}
          height={640}
          className="absolute inset-0 h-full w-full object-cover object-[center_34%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.85)_0%,rgba(15,23,42,0.68)_42%,rgba(15,23,42,0.55)_100%)]" />

        <div className="relative grid gap-6 p-5 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div>
            <p className="inline-flex rounded-full border border-cyan-100/60 bg-cyan-200/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
              {dict.home.badge}
            </p>
            <h1 className="mt-4 max-w-3xl font-[var(--font-sora)] text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
              {dict.home.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-200 md:text-base">{settings.siteTagline || dict.home.subtitle}</p>

            <form action="/jobs" className="mt-6 grid gap-2 rounded-2xl border border-white/20 bg-white/90 p-3 sm:grid-cols-[1.2fr_1fr_auto]">
              <input
                name="q"
                placeholder={dict.home.searchPlaceholder}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
              />
              <input
                name="location"
                placeholder={dict.home.locationPlaceholder}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
              />
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">{dict.home.searchAction}</button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href="/jobs" className="inline-flex items-center gap-1 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-600">
                {dict.home.browseJobs} <ArrowRight className="size-4" />
              </Link>
              <Link href="/me" className="rounded-full border border-white/50 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20">
                {dict.nav.workspace}
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/25 bg-slate-900/45 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">{isRo ? "Live board preview" : "Live board preview"}</p>
            <div className="mt-3 space-y-2">
              {latestJobs.slice(0, 3).map((job) => (
                <Link key={job.id} href={`/jobs?job=${job.slug}`} className="block rounded-2xl border border-white/20 bg-white/10 p-3 hover:bg-white/15">
                  <p className="text-xs text-cyan-100">{job.company.name}</p>
                  <p className="mt-1 font-[var(--font-sora)] text-base font-semibold text-white">{job.title}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-200">
                    <MapPin className="size-3.5" /> {job.location}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/25">
                <Image src="/visuals/home-hero-work.jpg" alt="Team work in open office" width={960} height={640} className="h-32 w-full object-cover object-[center_36%]" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/25">
                <Image src="/visuals/home-city-office.jpg" alt="Urban office landscape" width={960} height={640} className="h-32 w-full object-cover object-[center_48%]" />
              </div>
            </div>
          </aside>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" delayMs={40}>
        {highlights.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${item.tone}`}>{item.label}</p>
            <p className="mt-3 font-[var(--font-sora)] text-4xl font-semibold text-slate-900">{formatMetric(item.value)}</p>
          </article>
        ))}
      </ScrollReveal>

      <ScrollReveal as="section" className="grid gap-4 lg:grid-cols-3" delayMs={70}>
        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <Workflow className="size-3.5" /> {isRo ? "Cum functioneaza" : "How it works"}
          </p>
          <h2 className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-slate-900">{isRo ? "Publici in 3 pasi" : "Publish in 3 steps"}</h2>
          <ol className="mt-4 space-y-2 text-sm text-slate-700">
            <li>1. {isRo ? "Creezi compania si profilul jobului." : "Create your company and job profile."}</li>
            <li>2. {isRo ? "Trimiti listing-ul pentru review/publicare." : "Submit listing for review/publishing."}</li>
            <li>3. {isRo ? "Primeste aplicari si gestioneaza candidatii." : "Receive applications and manage candidates."}</li>
          </ol>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <Sparkles className="size-3.5" /> {isRo ? "Hiring pulse" : "Hiring pulse"}
          </p>
          <h2 className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-slate-900">{isRo ? "Activitate platforma" : "Platform activity"}</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span>{dict.admin.applications}</span>
              <span className="font-semibold">{formatMetric(applicationsCount)}</span>
            </p>
            <p className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span>{isRo ? "Vizualizari totale" : "Total views"}</span>
              <span className="font-semibold">{formatMetric(totalViews)}</span>
            </p>
            <p className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span>{dict.home.activeJobs}</span>
              <span className="font-semibold">{formatMetric(publishedJobsCount)}</span>
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <ShieldCheck className="size-3.5" /> {isRo ? "Control" : "Control"}
          </p>
          <h2 className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-slate-900">{isRo ? "Siguranta si moderare" : "Safety and moderation"}</h2>
          <p className="mt-3 text-sm text-slate-700">
            {isRo
              ? "Companiile verificate, regulile anti-spam si moderarea centralizata tin marketplace-ul curat si relevant."
              : "Verified companies, anti-spam rules, and centralized moderation keep the marketplace clean and relevant."}
          </p>
        </article>
      </ScrollReveal>

      <ScrollReveal as="section" className="grid gap-6 lg:grid-cols-2" delayMs={90}>
        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900">{dict.home.latestJobs}</h2>
          <div className="mt-4 space-y-3">
            {latestJobs.slice(0, 5).map((job) => (
              <article key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{job.company.name}</p>
                    <h3 className="mt-1 font-[var(--font-sora)] text-lg font-semibold text-slate-900">{job.title}</h3>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">{job.category?.name || "-"}</span>
                </div>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600">
                  <MapPin className="size-3.5" /> {job.location}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-700">{formatSalary(job.salaryMin, job.salaryMax, job.currency, locale, dict.common.salaryNotDisclosed)}</p>
                  <Link href={`/jobs/${job.slug}`} className="text-sm font-semibold text-slate-900 hover:text-cyan-800">
                    {dict.home.details}
                  </Link>
                </div>
              </article>
            ))}
            {latestJobs.length === 0 && <p className="text-slate-600">{dict.home.noPublished}</p>}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-900">{isRo ? "Descopera rapid" : "Discover faster"}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {isRo
              ? "Intrari rapide pe orase si categorii populare."
              : "Quick entries by popular cities and categories."}
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <MapPin className="size-3.5" /> {isRo ? "Orase populare" : "Popular cities"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topCities.map(([city, count]) => (
                <Link key={city} href={`/jobs?city=${encodeURIComponent(city)}`} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400">
                  {city} ({formatMetric(count)})
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <BriefcaseBusiness className="size-3.5" /> {isRo ? "Categorii populare" : "Popular categories"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topCategories.map(([name, count]) => (
                <span key={name} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                  {name} ({formatMetric(count)})
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <Image src="/visuals/home-city-office.jpg" alt="City and category network" width={920} height={560} className="h-44 w-full object-cover object-[center_55%]" />
          </div>
        </article>
      </ScrollReveal>

      <ScrollReveal as="section" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-3" delayMs={110}>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <Building2 className="size-3.5" /> {isRo ? "Companii" : "Companies"}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {isRo ? "Publicare rapida de joburi si control complet in admin." : "Fast job publishing with full admin control."}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <BriefcaseBusiness className="size-3.5" /> {isRo ? "Candidati" : "Candidates"}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {isRo ? "Aplica rapid, salveaza joburi si urmareste progresul." : "Apply quickly, save jobs and track progress."}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <ArrowRight className="size-3.5" /> {isRo ? "Flux" : "Flow"}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {isRo ? "Draft -> review -> publicare, cu statistici si moderare." : "Draft -> review -> publish, with stats and moderation."}
          </p>
        </article>
      </ScrollReveal>

      <ScrollReveal as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 p-6 md:p-7" delayMs={130}>
        <Image src="/visuals/home-cta.jpg" alt="Team preparing hiring strategy" width={1920} height={520} className="absolute inset-0 h-full w-full object-cover object-[center_45%]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.88)_0%,rgba(15,23,42,0.66)_62%,rgba(15,23,42,0.55)_100%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">{isRo ? "Start rapid" : "Quick start"}</p>
            <h2 className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-white">
              {isRo ? "Porneste acum si publica primul anunt" : "Start now and publish your first listing"}
            </h2>
            <p className="mt-2 text-sm text-slate-200">
              {isRo
                ? "Dureaza cateva minute sa configurezi compania si sa intri in fluxul complet de recrutare."
                : "It takes a few minutes to set up your company and enter a full hiring workflow."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/register" className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-600">
              {dict.nav.join}
            </Link>
            <Link href="/jobs" className="rounded-full border border-white/50 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20">
              {dict.home.browseJobs}
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </main>
  );
}
