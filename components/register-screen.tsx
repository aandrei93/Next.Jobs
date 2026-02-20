import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { registerUser } from "@/lib/public-actions";

export type RegisterActionState = {
  ok: boolean;
  error: string;
  values: {
    name: string;
    accountType: "candidate" | "employer";
    email: string;
    password: string;
    citizenship: string;
    birthDate: string;
    companyName: string;
    companyCity: string;
    companyWebsite: string;
  };
  fieldErrors: Record<string, string[] | undefined>;
};

type RegisterScreenProps = {
  locale: "ro" | "en";
  type: "candidate" | "employer";
};

export async function RegisterScreen({ locale, type }: RegisterScreenProps) {
  const [session, settings] = await Promise.all([
    getCurrentSession(),
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
  ]);

  if (session) {
    redirect("/jobs");
  }

  async function registerAction(_prevState: RegisterActionState, formData: FormData): Promise<RegisterActionState> {
    "use server";

    const result = await registerUser(formData);
    if (result.ok) {
      redirect("/login?verify=1");
    }

    const isRoLocal = locale === "ro";
    const translateFieldError = (field: string) => {
      if (isRoLocal) {
        if (field === "name") return "Numele trebuie sa aiba cel putin 2 caractere.";
        if (field === "email") return "Introdu o adresa de email valida.";
        if (field === "password") return "Parola trebuie sa aiba cel putin 6 caractere.";
        if (field === "companyName") return "Numele companiei este obligatoriu pentru contul de angajator.";
        if (field === "companyCity") return "Orasul companiei este obligatoriu pentru contul de angajator.";
        if (field === "companyWebsite") return "Website-ul companiei trebuie sa fie un URL valid (ex: https://companie.ro).";
        if (field === "citizenship") return "Nationalitatea introdusa este invalida.";
        if (field === "birthDate") return "Data nasterii introdusa este invalida.";
        if (field === "privacyAccepted") return "Trebuie sa accepti politica de confidentialitate.";
        return "Camp invalid. Verifica valoarea introdusa.";
      }
      if (field === "name") return "Name must contain at least 2 characters.";
      if (field === "email") return "Please provide a valid email address.";
      if (field === "password") return "Password must contain at least 6 characters.";
      if (field === "companyName") return "Company name is required for employer accounts.";
      if (field === "companyCity") return "Company city is required for employer accounts.";
      if (field === "companyWebsite") return "Company website must be a valid URL (ex: https://company.com).";
      if (field === "citizenship") return "Nationality value is invalid.";
      if (field === "birthDate") return "Birth date value is invalid.";
      if (field === "privacyAccepted") return "You must accept the privacy policy.";
      return "Invalid field value. Please review your input.";
    };
    const translatedFieldErrors = Object.fromEntries(
      Object.keys(result.fieldErrors || {}).map((field) => [field, [translateFieldError(field)]])
    ) as Record<string, string[] | undefined>;

    return {
      ok: false,
      error:
        result.error === "User already exists"
          ? isRoLocal
            ? "Exista deja un cont cu acest email."
            : "An account with this email already exists."
          : result.error === "Too many registration attempts. Please retry later."
            ? isRoLocal
              ? "Prea multe incercari de inregistrare. Reincearca mai tarziu."
              : "Too many registration attempts. Please retry later."
            : isRoLocal
              ? "Date invalide la inregistrare. Verifica email-ul, parola si datele companiei."
              : "Invalid registration data. Check email, password, and company details.",
      values: {
        name: result.values.name,
        accountType: result.values.accountType === "employer" ? "employer" : "candidate",
        email: result.values.email,
        password: result.values.password,
        citizenship: result.values.citizenship,
        birthDate: result.values.birthDate,
        companyName: result.values.companyName,
        companyCity: result.values.companyCity,
        companyWebsite: result.values.companyWebsite,
      },
      fieldErrors: translatedFieldErrors,
    };
  }

  const isRo = locale === "ro";

  return (
    <main className="w-full">
      <section
        className="w-full bg-cover bg-no-repeat bg-[position:center_30%] md:bg-[position:center_44%]"
        style={{ backgroundImage: "linear-gradient(120deg, rgba(15,63,90,0.92) 0%, rgba(30,94,125,0.86) 55%, rgba(18,61,86,0.92) 100%), url('/visuals/auth-photo-2.jpg')" }}
      >
        <div className="mx-auto w-full max-w-[1500px] px-4 pt-10 pb-10 md:pt-12 md:pb-12">
          <div className="mx-auto max-w-[1060px] rounded-2xl border border-white/25 bg-[#1b5571]/85 px-6 py-12 text-white md:px-10 md:py-14">
            <h1 className="text-center font-[var(--font-sora)] text-3xl font-semibold text-white">
              {type === "employer"
                ? isRo
                  ? "Inregistrare angajator"
                  : "Employer sign up"
                : isRo
                  ? "Inregistrare candidat"
                  : "Candidate sign up"}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-200">
              {type === "employer"
                ? isRo
                  ? "Completeaza datele companiei si activeaza contul pentru publicare joburi."
                  : "Complete your company details and activate your posting account."
                : isRo
                  ? "Completeaza profilul de candidat pentru a aplica rapid la joburi."
                  : "Complete your candidate profile to apply quickly to jobs."}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:py-10">
          <section className="relative mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.6)]">
            <RegisterForm
              locale={locale}
              allowPublicRegistration={settings.allowPublicRegistration}
              registerAction={registerAction}
              initialAccountType={type}
            />
          </section>
        </div>
      </section>
    </main>
  );
}

