import type { Metadata } from "next";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { createAdminUser, updateUserRole } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
export const metadata: Metadata = { title: "Users" };

type AdminUsersPageProps = {
  searchParams: Promise<{ accountType?: string | string[] }>;
};

function firstValue(value?: string | string[]) {
  if (!value) {
    return "";
  }
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const [locale, rawSearchParams] = await Promise.all([getLocale(), searchParams]);
  const dict = await getDictionary(locale);
  const isRo = locale === "ro";
  const selectedAccountType = firstValue(rawSearchParams.accountType);
  const accountType = selectedAccountType === "candidate" || selectedAccountType === "employer" ? selectedAccountType : "";

  const users = await prisma.user.findMany({
    where: accountType ? { accountType } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountType: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dict.admin.users}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Administrare acces si roluri pentru utilizatori." : "Manage user access and role permissions."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Filtru rol cont" : "Account type filter"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/users" className={`rounded-md border px-3 py-1.5 text-sm ${accountType === "" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
            {isRo ? "Toate" : "All"}
          </Link>
          <Link href="/admin/users?accountType=candidate" className={`rounded-md border px-3 py-1.5 text-sm ${accountType === "candidate" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
            {isRo ? "Candidati" : "Candidates"}
          </Link>
          <Link href="/admin/users?accountType=employer" className={`rounded-md border px-3 py-1.5 text-sm ${accountType === "employer" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
            {isRo ? "Angajatori" : "Employers"}
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.admin.createUser}</h2>
        <form action={createAdminUser} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="name" required placeholder="Nume" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="email" name="email" required placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="password" name="password" required placeholder="Parola" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="role" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2">{dict.admin.create}</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.admin.existingUsers}</h2>
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <article key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-4">
              <div>
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {isRo ? "Tip cont:" : "Account type:"}{" "}
                  <span className="font-semibold text-slate-700">{user.accountType === "employer" ? (isRo ? "Angajator" : "Employer") : (isRo ? "Candidat" : "Candidate")}</span>
                </p>
              </div>
              <form action={updateUserRole} className="flex items-center gap-2">
                <input type="hidden" name="id" value={user.id} />
                <select name="role" defaultValue={user.role} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">{dict.admin.save}</button>
              </form>
            </article>
          ))}
          {users.length === 0 && <p className="text-sm text-slate-600">{dict.admin.noUsers}</p>}
        </div>
      </section>
    </div>
  );
}

