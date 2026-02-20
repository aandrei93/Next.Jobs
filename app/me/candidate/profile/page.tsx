import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { ProfileSecurityForm } from "@/components/profile-security-form";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { relativeDate } from "@/lib/jobs-query";
import { availabilityLabel, workAuthorizationLabel, workPreferenceLabel } from "@/lib/resume-options";
import { logoutAllDevices, updateMyCredentials } from "@/lib/security-actions";
import { updateMyProfile } from "@/lib/user-actions";
export const metadata: Metadata = { title: "My profile" };

type ProfilePageProps = {
  searchParams: Promise<{ security?: string }>;
};

export default async function WorkspaceProfilePage({ searchParams }: ProfilePageProps) {
  const [session, locale] = await Promise.all([getCurrentSession(), getLocale()]);
  const dict = await getDictionary(locale);
  const params = await searchParams;

  if (!session) {
    return null;
  }

  const [user, resume, postedJobs, savedJobs, applicationsCount, applications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        city: true,
        citizenship: true,
        birthDate: true,
        gender: true,
        website: true,
        linkedin: true,
        github: true,
        bio: true,
        notifyNewApplicationEmail: true,
        notifyDigestEmail: true,
      },
    }),
    prisma.resume.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.job.count({ where: { createdById: session.user.id } }),
    prisma.savedJob.count({ where: { userId: session.user.id } }),
    prisma.application.count({ where: { userId: session.user.id } }),
    prisma.application.findMany({
      where: { userId: session.user.id },
      include: {
        job: {
          select: {
            slug: true,
            title: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user) {
    return null;
  }

  const stats = [
    { label: dict.me.statsPostedJobs, value: postedJobs },
    { label: dict.me.statsSavedJobs, value: savedJobs },
    { label: dict.me.statsApplications, value: applicationsCount },
    { label: dict.me.statsResume, value: resume ? 1 : 0 },
  ];

  const securityStatus = params.security || "";
  const securityMessages: Record<string, string> = {
    invalid: locale === "ro" ? "Date invalide. Verifica campurile de securitate." : "Invalid data. Please verify security fields.",
    current_password_invalid: locale === "ro" ? "Parola curenta este incorecta." : "Current password is incorrect.",
    password_mismatch: locale === "ro" ? "Parola noua si confirmarea nu coincid sau sunt prea scurte." : "New password and confirmation do not match or are too short.",
    email_taken: locale === "ro" ? "Adresa de email este deja folosita." : "Email address is already in use.",
    nothing_changed: locale === "ro" ? "Nu ai schimbat nimic in datele de conectare." : "No login credentials were changed.",
    updated: locale === "ro" ? "Datele de conectare au fost actualizate." : "Login credentials were updated.",
    updated_verify_email:
      locale === "ro"
        ? "Datele au fost actualizate. Verifica noul email pentru confirmare."
        : "Credentials updated. Verify your new email address from inbox.",
  };
  const securityMessage = securityStatus ? securityMessages[securityStatus] : null;
  const isSecurityError = securityStatus && !["updated", "updated_verify_email"].includes(securityStatus);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{dict.me.profile}</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.me.profileStats}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <article key={item.label} className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{dict.me.editProfile}</h2>
          <form action={updateMyProfile} className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="name" required defaultValue={user.name} placeholder={dict.jobs.fullName} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input
              type="email"
              value={user.email}
              disabled
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
            />
            <input name="title" defaultValue={user.title || ""} placeholder={dict.me.profileTitle} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="city" defaultValue={user.city || ""} placeholder={locale === "ro" ? "Locatie" : "Location"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="citizenship" defaultValue={user.citizenship || ""} placeholder={locale === "ro" ? "Cetatenie" : "Citizenship"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input
              name="birthDate"
              type="date"
              defaultValue={user.birthDate ? user.birthDate.toISOString().slice(0, 10) : ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select name="gender" defaultValue={user.gender || ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">{locale === "ro" ? "Sex (optional)" : "Sex (optional)"}</option>
              <option value={locale === "ro" ? "Masculin" : "Male"}>{locale === "ro" ? "Masculin" : "Male"}</option>
              <option value={locale === "ro" ? "Feminin" : "Female"}>{locale === "ro" ? "Feminin" : "Female"}</option>
              <option value={locale === "ro" ? "Altul" : "Other"}>{locale === "ro" ? "Altul" : "Other"}</option>
              <option value={locale === "ro" ? "Prefer sa nu spun" : "Prefer not to say"}>{locale === "ro" ? "Prefer sa nu spun" : "Prefer not to say"}</option>
            </select>
            <input name="website" defaultValue={user.website || ""} placeholder={dict.me.profileWebsite} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="linkedin" defaultValue={user.linkedin || ""} placeholder={dict.me.profileLinkedin} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="github" defaultValue={user.github || ""} placeholder={dict.me.profileGithub} className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
            <textarea name="bio" rows={5} defaultValue={user.bio || ""} placeholder={dict.me.profileBio} className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:col-span-2">
              <input type="checkbox" name="notifyNewApplicationEmail" defaultChecked={user.notifyNewApplicationEmail} />
              {locale === "ro" ? "Trimite email la aplicari noi primite pe joburile mele" : "Send email for new applications on my jobs"}
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:col-span-2">
              <input type="checkbox" name="notifyDigestEmail" defaultChecked={user.notifyDigestEmail} />
              {locale === "ro" ? "Trimite digest zilnic cu sumarul aplicarilor" : "Send daily digest summary of applications"}
            </label>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2">
              {dict.me.saveProfile}
            </button>
          </form>
          <form action={logoutAllDevices} className="mt-3">
            <button className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50">
              {locale === "ro" ? "Logout pe toate device-urile" : "Logout all devices"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="text-base font-semibold text-slate-900">{locale === "ro" ? "Securitate cont" : "Account security"}</h3>
            <p className="mt-1 text-xs text-slate-600">
              {locale === "ro"
                ? "Aici iti poti schimba parola si adresa de email folosita la autentificare."
                : "Change your password and the email used for authentication."}
            </p>
            {securityMessage && (
              <p
                className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                  isSecurityError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {securityMessage}
              </p>
            )}
            <ProfileSecurityForm locale={locale} currentEmail={user.email} action={updateMyCredentials} />
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">{dict.me.resumePreview}</h2>
          {resume ? (
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{resume.headline || "-"}</p>
              <p>{resume.summary || "-"}</p>
              <p>
                <span className="font-medium text-slate-900">{dict.me.skills}:</span> {resume.skills || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Limbi" : "Languages"}:</span> {resume.languages || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{dict.me.desiredRole}:</span> {resume.desiredRole || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{dict.me.preferredCity}:</span> {resume.preferredCity || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Cetatenie" : "Citizenship"}:</span> {user.citizenship || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Locatie" : "Location"}:</span> {user.city || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Data nasterii" : "Date of birth"}:</span>{" "}
                {user.birthDate
                  ? user.birthDate.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Sex" : "Sex"}:</span> {user.gender || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Telefon" : "Phone"}:</span> {resume.phone || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Disponibilitate" : "Availability"}:</span> {availabilityLabel(resume.availability, locale)}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Work preference" : "Work preference"}:</span> {workPreferenceLabel(resume.workPreference, locale)}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Work authorization" : "Work authorization"}:</span> {workAuthorizationLabel(resume.workAuthorization, locale)}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Permis" : "Driving license"}:</span> {resume.drivingLicense || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Salariu dorit" : "Expected salary"}:</span> {resume.expectedSalary || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-900">{locale === "ro" ? "Hobby-uri/interese" : "Hobbies/interests"}:</span> {resume.hobbies || "-"}
              </p>
              <Link href="/me/candidate/resume" className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
                {dict.me.updateResume}
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              {dict.me.noResumeYet}{" "}
              <Link href="/me/candidate/resume" className="font-semibold text-slate-900">
                {dict.me.updateResume}
              </Link>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{dict.me.latestApplications}</h2>
        <div className="mt-4 space-y-3">
          {applications.map((application) => (
            <article key={application.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">
                  {application.job.title} - {application.job.company.name}
                </p>
                <p className="text-xs text-slate-500">
                  {dict.me.submittedOn}: {relativeDate(application.createdAt, locale)}
                </p>
              </div>
              <div className="mt-3">
                <Link href={`/jobs/${application.job.slug}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
                  {dict.common.viewJob}
                </Link>
              </div>
            </article>
          ))}
          {applications.length === 0 && <p className="text-sm text-slate-600">{dict.me.noApplications}</p>}
        </div>
      </section>
    </div>
  );
}


