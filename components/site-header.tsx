import Image from "next/image";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { LogoutButton } from "@/components/logout-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { prisma } from "@/lib/db";
import { formatCompactMetric } from "@/lib/format-metrics";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function SiteHeader() {
  const [session, locale, settings] = await Promise.all([
    getCurrentSession(),
    getLocale(),
    prisma.siteSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} }),
  ]);
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const workspaceApplicationsHref = session
    ? session.user.accountType === "employer"
      ? "/me/employer/applications"
      : "/me/candidate/applications"
    : "/me";

  const [savedJobsCount, candidateRows, ownerRows, candidateLatest, ownerLatest] = session
    ? await Promise.all([
        prisma.savedJob.count({
          where: { userId: session.user.id },
        }),
        prisma.application.findMany({
          where: {
            userId: session.user.id,
            lastMessageAt: { not: null },
          },
          select: { lastMessageAt: true, lastReadByCandidateAt: true },
        }),
        prisma.application.findMany({
          where: {
            job: { createdById: session.user.id },
            lastMessageAt: { not: null },
          },
          select: { lastMessageAt: true, lastReadByOwnerAt: true },
        }),
        prisma.application.findMany({
          where: {
            userId: session.user.id,
            lastMessageAt: { not: null },
          },
          orderBy: { lastMessageAt: "desc" },
          take: 5,
          select: {
            id: true,
            lastMessageAt: true,
            lastReadByCandidateAt: true,
            job: { select: { title: true, company: { select: { name: true } } } },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { content: true, createdAt: true, sender: { select: { id: true, name: true } } },
            },
          },
        }),
        prisma.application.findMany({
          where: {
            job: { createdById: session.user.id },
            lastMessageAt: { not: null },
          },
          orderBy: { lastMessageAt: "desc" },
          take: 5,
          select: {
            id: true,
            lastMessageAt: true,
            lastReadByOwnerAt: true,
            job: { select: { title: true, company: { select: { name: true } } } },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { content: true, createdAt: true, sender: { select: { id: true, name: true } } },
            },
          },
        }),
      ])
    : [0, [], [], [], []];
  const candidateUnread = candidateRows.filter(
    (item) => item.lastMessageAt && (!item.lastReadByCandidateAt || item.lastMessageAt > item.lastReadByCandidateAt)
  ).length;
  const ownerUnread = ownerRows.filter(
    (item) => item.lastMessageAt && (!item.lastReadByOwnerAt || item.lastMessageAt > item.lastReadByOwnerAt)
  ).length;
  const unreadMessages = candidateUnread + ownerUnread;
  const mergedConversations = session
    ? [
        ...candidateLatest.map((item) => ({
          id: item.id,
          role: "candidate" as const,
          lastMessageAt: item.lastMessageAt ?? item.messages[0]?.createdAt ?? new Date(0),
          unread: Boolean(item.lastMessageAt && (!item.lastReadByCandidateAt || item.lastMessageAt > item.lastReadByCandidateAt)),
          jobTitle: item.job.title,
          companyName: item.job.company.name,
          latestMessage: item.messages[0]?.content || "",
          latestSender: item.messages[0]?.sender.name || "",
        })),
        ...ownerLatest.map((item) => ({
          id: item.id,
          role: "owner" as const,
          lastMessageAt: item.lastMessageAt ?? item.messages[0]?.createdAt ?? new Date(0),
          unread: Boolean(item.lastMessageAt && (!item.lastReadByOwnerAt || item.lastMessageAt > item.lastReadByOwnerAt)),
          jobTitle: item.job.title,
          companyName: item.job.company.name,
          latestMessage: item.messages[0]?.content || "",
          latestSender: item.messages[0]?.sender.name || "",
        })),
      ]
        .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
        .reduce<Array<{
          id: string;
          role: "candidate" | "owner";
          lastMessageAt: Date;
          unread: boolean;
          jobTitle: string;
          companyName: string;
          latestMessage: string;
          latestSender: string;
        }>>((acc, item) => {
          if (acc.some((entry) => entry.id === item.id)) {
            return acc;
          }
          acc.push(item);
          return acc;
        }, [])
        .slice(0, 5)
    : [];

  return (
    <header data-site-header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between px-[var(--layout-gutter)] py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="inline-flex items-center">
            <Image src="/brand/nextjobs-logo.svg" alt="nextjobs" width={160} height={40} priority className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/jobs" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">
              {dict.nav.findJobs}
            </Link>
            {session && (
              <Link href="/me" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                {dict.nav.workspace}
              </Link>
            )}
            {session && settings.featureSavedJobs && (
              <Link href="/saved-jobs" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                {dict.nav.savedJobs} ({formatCompactMetric(savedJobsCount, locale)})
              </Link>
            )}
            {session?.user.role === "ADMIN" && (
              <Link href="/admin" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                {dict.nav.adminPanel}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <details className="relative md:hidden">
            <summary className="list-none rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700">
              {isRo ? "Meniu" : "Menu"}
            </summary>
            <div className="absolute right-0 top-11 z-50 min-w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <Link href="/jobs" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                {dict.nav.findJobs}
              </Link>
              {session && (
                <Link href="/me" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  {dict.nav.workspace}
                </Link>
              )}
              {session && settings.featureSavedJobs && (
                <Link href="/saved-jobs" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  {dict.nav.savedJobs} ({formatCompactMetric(savedJobsCount, locale)})
                </Link>
              )}
              {session && (
                <Link href={workspaceApplicationsHref} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  {isRo ? "Mesaje" : "Messages"} {unreadMessages > 0 ? `(${formatCompactMetric(unreadMessages, locale)})` : ""}
                </Link>
              )}
              {session?.user.role === "ADMIN" && (
                <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  {dict.nav.adminPanel}
                </Link>
              )}
            </div>
          </details>

          {!session ? (
            <>
              <LocaleSwitcher locale={locale} />
              <Link
                href="/login"
                className="rounded-full border border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                {dict.nav.login}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-slate-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                {dict.nav.join}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold md:inline-block ${
                  session.user.accountType === "employer"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {session.user.accountType === "employer" ? dict.nav.employerBadge : dict.nav.candidateBadge}
              </span>
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 md:inline-block">
                {session.user.name}
              </span>
              <NotificationsDropdown
                locale={locale}
                unreadCount={unreadMessages}
                unreadBadge={formatCompactMetric(unreadMessages, locale)}
                inboxHref={workspaceApplicationsHref}
                conversations={mergedConversations.map((conversation) => ({
                  id: conversation.id,
                  unread: conversation.unread,
                  jobTitle: conversation.jobTitle,
                  companyName: conversation.companyName,
                  latestMessage: conversation.latestMessage,
                  latestSender: conversation.latestSender,
                  lastMessageAt: conversation.lastMessageAt.toISOString(),
                }))}
              />
              <LocaleSwitcher locale={locale} />
              <LogoutButton label={dict.nav.logout} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
