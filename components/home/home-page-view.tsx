import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { formatSalary } from "@/lib/utils";

type HomeDict = {
  home: {
    badge: string;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    locationPlaceholder: string;
    searchAction: string;
    browseJobs: string;
    latestJobs: string;
    details: string;
    noPublished: string;
  };
  nav: {
    join: string;
  };
  common: {
    salaryNotDisclosed: string;
  };
};

type HomeJobPreview = {
  id: string;
  slug: string;
  title: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  company: { name: string };
  category: { name: string } | null;
};

type WhyItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
};

type HomePageViewProps = {
  locale: "ro" | "en";
  dict: HomeDict;
  siteTagline: string | null | undefined;
  latestJobs: HomeJobPreview[];
  trustSignals: Array<{ label: string; value: string }>;
  whyItems: WhyItem[];
  successStories: Array<{ name: string; role: string; quote: string; image: string }>;
  showcasePillars: string[];
  topCities: Array<{ city: string; countLabel: string }>;
  topCategories: Array<{ slug: string; label: string; countLabel: string }>;
  averageApplicationsPerJobLabel: string;
  publishedJobsCountLabel: string;
};

export function HomePageView({
  locale,
  dict,
  siteTagline,
  latestJobs,
  trustSignals,
  whyItems,
  successStories,
  showcasePillars,
  topCities,
  topCategories,
  averageApplicationsPerJobLabel,
  publishedJobsCountLabel,
}: HomePageViewProps) {
  const isRo = locale === "ro";

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
            <p className="mt-4 max-w-2xl text-sm text-slate-200 md:text-base">{siteTagline || dict.home.subtitle}</p>

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
              <Link href="/register/employer" className="rounded-full border border-white/50 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20">
                {isRo ? "Publica job" : "Post a job"}
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {trustSignals.map((signal) => (
                <p key={signal.label} className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-slate-100">
                  <span className="font-semibold text-white">{signal.value}</span> {signal.label}
                </p>
              ))}
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

      <ScrollReveal as="section" className="space-y-4" delayMs={70}>
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <Sparkles className="size-3.5" /> {isRo ? "De ce Next.Jobs" : "Why Next.Jobs"}
            </p>
            <h2 className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-slate-900">
              {isRo ? "Platforma construita pentru viteza si rezultate" : "Built for speed and outcomes"}
            </h2>
          </div>
          <p className="text-sm text-slate-600">
            {isRo ? "De la publicare la aplicare, tot fluxul ramane clar si usor de administrat." : "From posting to applying, the entire flow stays clear and easy to manage."}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {whyItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="group rounded-3xl border border-slate-200 bg-[linear-gradient(160deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.75)] transition-transform duration-300 hover:-translate-y-1">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <Icon className="size-3.5" /> {item.title}
                </p>
                <p className="mt-3 text-sm text-slate-700">{item.description}</p>
                <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/80 px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-cyan-900">{item.metricLabel}</p>
                  <p className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-950">{item.metricValue}</p>
                </div>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> {isRo ? "Validat in productie" : "Validated in production"}
                </p>
              </article>
            );
          })}
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" delayMs={82}>
        <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-5 md:p-6">
          <Image
            src="/visuals/home-hero-work.jpg"
            alt="Hiring team discussing roles"
            width={1440}
            height={900}
            className="absolute inset-0 h-full w-full object-cover object-[center_45%] opacity-30"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.9)_0%,rgba(15,23,42,0.72)_55%,rgba(15,23,42,0.55)_100%)]" />
          <div className="relative">
            <p className="inline-flex rounded-full border border-cyan-200/40 bg-cyan-200/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
              {isRo ? "Success stories" : "Success stories"}
            </p>
            <h2 className="mt-3 max-w-xl font-[var(--font-sora)] text-2xl font-semibold text-white md:text-3xl">
              {isRo ? "Echipe reale, rezultate reale" : "Real teams, real outcomes"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              {isRo
                ? "Companii care folosesc Next.Jobs isi optimizeaza procesul de recrutare fara a complica experienta candidatului."
                : "Teams using Next.Jobs streamline hiring operations without making the candidate experience heavier."}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {successStories.map((story) => (
                <article key={story.name} className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Image src={story.image} alt={story.name} width={56} height={56} className="size-12 rounded-xl object-cover" />
                    <div>
                      <p className="font-semibold text-white">{story.name}</p>
                      <p className="text-xs text-cyan-100">{story.role}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-100">&ldquo;{story.quote}&rdquo;</p>
                </article>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
          <h3 className="font-[var(--font-sora)] text-xl font-semibold text-slate-900">{isRo ? "Unde performeaza platforma" : "Where the platform performs"}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {isRo
              ? "Segmentele unde fluxul complet de publicare, aplicare si moderare aduce rezultate rapide."
              : "Segments where the full publish-apply-moderate flow drives fast outcomes."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {showcasePillars.map((item) => (
              <span key={item} className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <Image src="/visuals/talent-grid.svg" alt="Talent categories network" width={920} height={560} className="h-44 w-full bg-slate-50 object-cover" />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <p className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span>{isRo ? "Rata aplicari / job" : "Application / job rate"}</span>
              <span className="font-semibold">{averageApplicationsPerJobLabel}</span>
            </p>
            <p className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span>{isRo ? "Joburi active" : "Active jobs"}</span>
              <span className="font-semibold">{publishedJobsCountLabel}</span>
            </p>
          </div>
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
            {isRo ? "Intrari rapide pe orase si categorii populare." : "Quick entries by popular cities and categories."}
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <MapPin className="size-3.5" /> {isRo ? "Orase populare" : "Popular cities"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topCities.map((item) => (
                <Link key={item.city} href={`/jobs?city=${encodeURIComponent(item.city)}`} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400">
                  {item.city} ({item.countLabel})
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <BriefcaseBusiness className="size-3.5" /> {isRo ? "Categorii populare" : "Popular categories"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topCategories.map((item) => (
                <Link
                  key={item.slug}
                  href={`/jobs?category=${encodeURIComponent(item.slug)}`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1"
                  aria-label={`${item.label} (${item.countLabel})`}
                >
                  {item.label} ({item.countLabel})
                </Link>
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
