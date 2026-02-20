import { Gauge, TrendingUp, Users } from "lucide-react";
import { HomePageView } from "@/components/home/home-page-view";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";

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

  const [latestJobs, publishedSnapshot, companiesCount, usersCount, publishedJobsCount, applicationsCount, viewsAggregate] = await Promise.all([
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
        category: { select: { slug: true, name: true } },
      },
      take: 120,
    }),
    prisma.company.count(),
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
  const totalViews = viewsAggregate._sum.viewsCount || 0;
  const averageApplicationsPerJob = publishedJobsCount > 0 ? applicationsCount / publishedJobsCount : 0;

  const cityMap = publishedSnapshot.reduce<Record<string, number>>((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {});

  const categoryMap = publishedSnapshot.reduce<Record<string, { label: string; count: number }>>((acc, item) => {
    const slug = item.category?.slug;
    const name = item.category?.name;
    if (!slug || !name) {
      return acc;
    }
    if (!acc[slug]) {
      acc[slug] = { label: name, count: 0 };
    }
    acc[slug].count += 1;
    return acc;
  }, {});

  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([city, count]) => ({ city, countLabel: formatMetric(count) }));

  const topCategories = Object.entries(categoryMap)
    .map(([slug, info]) => ({ slug, label: info.label, count: info.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6)
    .map((item) => ({ slug: item.slug, label: item.label, countLabel: formatMetric(item.count) }));

  const whyItems = [
    {
      icon: TrendingUp,
      title: isRo ? "Mai multe aplicari relevante" : "More relevant applications",
      description: isRo
        ? "Filtre rapide, listari clare si flux simplu de aplicare pentru candidati."
        : "Fast filters, clear listings, and a simple candidate application flow.",
      metricLabel: isRo ? "Aplicari / job publicat" : "Applications / published job",
      metricValue: averageApplicationsPerJob ? `${averageApplicationsPerJob.toFixed(1)}x` : "0.0x",
    },
    {
      icon: Gauge,
      title: isRo ? "Publicare rapida, controlata" : "Fast, controlled publishing",
      description: isRo
        ? "Flux draft -> review -> publish cu moderare centralizata si audit."
        : "Draft -> review -> publish workflow with centralized moderation and audit.",
      metricLabel: isRo ? "Joburi active" : "Active jobs",
      metricValue: formatMetric(publishedJobsCount),
    },
    {
      icon: Users,
      title: isRo ? "Experienta unificata" : "Unified experience",
      description: isRo
        ? "Workspace dedicat pentru candidati si angajatori, cu admin complet."
        : "Dedicated workspace for candidates and employers, with full admin control.",
      metricLabel: isRo ? "Utilizatori in platforma" : "Platform users",
      metricValue: formatMetric(usersCount),
    },
  ];

  const trustSignals = [
    { label: isRo ? "Aplicari totale" : "Total applications", value: formatMetric(applicationsCount) },
    { label: isRo ? "Vizualizari joburi" : "Job views", value: formatMetric(totalViews) },
    { label: isRo ? "Companii active" : "Active companies", value: formatMetric(companiesCount) },
  ];

  const showcasePillars = ["IT & Product", "Fintech", "E-commerce", "SaaS", "Remote teams", "Scale-ups"];
  const successStories = [
    {
      name: "Elena Popescu",
      role: isRo ? "HR Lead, Blue Orbit" : "HR Lead, Blue Orbit",
      quote: isRo
        ? "Am redus timpul de publicare la cateva minute si primim candidati mai relevanti."
        : "We cut publishing time to minutes and started getting much more relevant candidates.",
      image: "/visuals/auth-photo-1.jpg",
    },
    {
      name: "Matei Ionescu",
      role: isRo ? "Engineering Manager, TechNova" : "Engineering Manager, TechNova",
      quote: isRo
        ? "Fluxul candidat-angajator-admin este clar, iar echipa noastra se misca mai repede."
        : "The candidate-employer-admin flow is clear, and our team moves much faster.",
      image: "/visuals/auth-photo-3.jpg",
    },
  ];

  return (
    <HomePageView
      locale={locale}
      dict={dict}
      siteTagline={settings.siteTagline}
      latestJobs={latestJobs}
      trustSignals={trustSignals}
      whyItems={whyItems}
      successStories={successStories}
      showcasePillars={showcasePillars}
      topCities={topCities}
      topCategories={topCategories}
      averageApplicationsPerJobLabel={`${averageApplicationsPerJob.toFixed(1)}x`}
      publishedJobsCountLabel={formatMetric(publishedJobsCount)}
    />
  );
}
