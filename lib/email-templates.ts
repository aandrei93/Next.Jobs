import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/i18n";

export const EMAIL_TEMPLATE_KEYS = [
  "WELCOME_CANDIDATE",
  "NEW_JOB_POSTED",
  "JOB_REVIEW_DECISION",
  "NEW_APPLICATION_OWNER",
  "NEW_MESSAGE_OWNER",
  "NEW_MESSAGE_CANDIDATE",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

type TemplateDefault = {
  subject: string;
  textBody: string;
  htmlBody?: string;
  isEnabled?: boolean;
};

const defaults: Record<Locale, Record<EmailTemplateKey, TemplateDefault>> = {
  en: {
    WELCOME_CANDIDATE: {
      subject: "Welcome to NextJobs, {{name}}",
      textBody:
        "Hi {{name}},\n\nWelcome to NextJobs.\n\nLogin URL: {{loginUrl}}\nEmail: {{email}}\nPassword: {{password}}\n\nPlease change your password after first login.",
      htmlBody:
        "<p>Hi {{name}},</p><p>Welcome to <strong>NextJobs</strong>.</p><p><strong>Login URL:</strong> {{loginUrl}}<br/><strong>Email:</strong> {{email}}<br/><strong>Password:</strong> {{password}}</p><p>Please change your password after first login.</p>",
      isEnabled: true,
    },
    NEW_JOB_POSTED: {
      subject: "Your job was created: {{jobTitle}}",
      textBody:
        "Hi {{name}},\n\nYour job \"{{jobTitle}}\" was created successfully.\nReference: {{referenceNumber}}\nStatus: {{status}}\n\nManage it from: {{manageUrl}}",
      htmlBody:
        "<p>Hi {{name}},</p><p>Your job <strong>{{jobTitle}}</strong> was created successfully.</p><p><strong>Reference:</strong> {{referenceNumber}}<br/><strong>Status:</strong> {{status}}</p><p>Manage it from: <a href=\"{{manageUrl}}\">{{manageUrl}}</a></p>",
      isEnabled: true,
    },
    JOB_REVIEW_DECISION: {
      subject: "Job review update: {{jobTitle}}",
      textBody:
        "Hi {{name}},\n\nYour job \"{{jobTitle}}\" has been reviewed.\nDecision: {{decision}}\nReference: {{referenceNumber}}\nModerator note: {{moderationNote}}\n\nManage job: {{manageUrl}}",
      htmlBody:
        "<p>Hi {{name}},</p><p>Your job <strong>{{jobTitle}}</strong> has been reviewed.</p><p><strong>Decision:</strong> {{decision}}<br/><strong>Reference:</strong> {{referenceNumber}}<br/><strong>Moderator note:</strong> {{moderationNote}}</p><p>Manage job: <a href=\"{{manageUrl}}\">{{manageUrl}}</a></p>",
      isEnabled: true,
    },
    NEW_APPLICATION_OWNER: {
      subject: "New application for {{jobTitle}}",
      textBody:
        "Hi {{ownerName}},\n\nYou received a new application for \"{{jobTitle}}\".\nCandidate: {{candidateName}} ({{candidateEmail}})\n\nView applications: {{applicationsUrl}}",
      htmlBody:
        "<p>Hi {{ownerName}},</p><p>You received a new application for <strong>{{jobTitle}}</strong>.</p><p><strong>Candidate:</strong> {{candidateName}} ({{candidateEmail}})</p><p>View applications: <a href=\"{{applicationsUrl}}\">{{applicationsUrl}}</a></p>",
      isEnabled: true,
    },
    NEW_MESSAGE_OWNER: {
      subject: "New candidate message on {{jobTitle}}",
      textBody:
        "Hi {{ownerName}},\n\nYou received a new candidate message on \"{{jobTitle}}\".\n\nOpen thread: {{applicationsUrl}}",
      htmlBody:
        "<p>Hi {{ownerName}},</p><p>You received a new candidate message on <strong>{{jobTitle}}</strong>.</p><p>Open thread: <a href=\"{{applicationsUrl}}\">{{applicationsUrl}}</a></p>",
      isEnabled: true,
    },
    NEW_MESSAGE_CANDIDATE: {
      subject: "New recruiter message on {{jobTitle}}",
      textBody:
        "Hi {{candidateName}},\n\nYou received a new recruiter message on your application for \"{{jobTitle}}\".\n\nOpen thread: {{applicationsUrl}}",
      htmlBody:
        "<p>Hi {{candidateName}},</p><p>You received a new recruiter message on your application for <strong>{{jobTitle}}</strong>.</p><p>Open thread: <a href=\"{{applicationsUrl}}\">{{applicationsUrl}}</a></p>",
      isEnabled: true,
    },
  },
  ro: {
    WELCOME_CANDIDATE: {
      subject: "Bine ai venit pe NextJobs, {{name}}",
      textBody:
        "Salut {{name}},\n\nBine ai venit pe NextJobs.\n\nLink login: {{loginUrl}}\nEmail: {{email}}\nParola: {{password}}\n\nTe rugam sa schimbi parola dupa prima autentificare.",
      htmlBody:
        "<p>Salut {{name}},</p><p>Bine ai venit pe <strong>NextJobs</strong>.</p><p><strong>Link login:</strong> {{loginUrl}}<br/><strong>Email:</strong> {{email}}<br/><strong>Parola:</strong> {{password}}</p><p>Te rugam sa schimbi parola dupa prima autentificare.</p>",
      isEnabled: true,
    },
    NEW_JOB_POSTED: {
      subject: "Jobul tau a fost creat: {{jobTitle}}",
      textBody:
        "Salut {{name}},\n\nJobul \"{{jobTitle}}\" a fost creat cu succes.\nReferinta: {{referenceNumber}}\nStatus: {{status}}\n\nIl poti gestiona aici: {{manageUrl}}",
      htmlBody:
        "<p>Salut {{name}},</p><p>Jobul <strong>{{jobTitle}}</strong> a fost creat cu succes.</p><p><strong>Referinta:</strong> {{referenceNumber}}<br/><strong>Status:</strong> {{status}}</p><p>Il poti gestiona aici: <a href=\"{{manageUrl}}\">{{manageUrl}}</a></p>",
      isEnabled: true,
    },
    JOB_REVIEW_DECISION: {
      subject: "Actualizare review job: {{jobTitle}}",
      textBody:
        "Salut {{name}},\n\nJobul tau \"{{jobTitle}}\" a fost analizat.\nDecizie: {{decision}}\nReferinta: {{referenceNumber}}\nNota moderator: {{moderationNote}}\n\nGestioneaza jobul: {{manageUrl}}",
      htmlBody:
        "<p>Salut {{name}},</p><p>Jobul tau <strong>{{jobTitle}}</strong> a fost analizat.</p><p><strong>Decizie:</strong> {{decision}}<br/><strong>Referinta:</strong> {{referenceNumber}}<br/><strong>Nota moderator:</strong> {{moderationNote}}</p><p>Gestioneaza jobul: <a href=\"{{manageUrl}}\">{{manageUrl}}</a></p>",
      isEnabled: true,
    },
    NEW_APPLICATION_OWNER: {
      subject: "Aplicare noua pentru {{jobTitle}}",
      textBody:
        "Salut {{ownerName}},\n\nAi primit o aplicare noua pentru \"{{jobTitle}}\".\nCandidat: {{candidateName}} ({{candidateEmail}})\n\nVezi aplicatiile: {{applicationsUrl}}",
      htmlBody:
        "<p>Salut {{ownerName}},</p><p>Ai primit o aplicare noua pentru <strong>{{jobTitle}}</strong>.</p><p><strong>Candidat:</strong> {{candidateName}} ({{candidateEmail}})</p><p>Vezi aplicatiile: <a href=\"{{applicationsUrl}}\">{{applicationsUrl}}</a></p>",
      isEnabled: true,
    },
    NEW_MESSAGE_OWNER: {
      subject: "Mesaj nou de la candidat pe {{jobTitle}}",
      textBody:
        "Salut {{ownerName}},\n\nAi primit un mesaj nou de la candidat pentru \"{{jobTitle}}\".\n\nDeschide conversatia: {{applicationsUrl}}",
      htmlBody:
        "<p>Salut {{ownerName}},</p><p>Ai primit un mesaj nou de la candidat pentru <strong>{{jobTitle}}</strong>.</p><p>Deschide conversatia: <a href=\"{{applicationsUrl}}\">{{applicationsUrl}}</a></p>",
      isEnabled: true,
    },
    NEW_MESSAGE_CANDIDATE: {
      subject: "Mesaj nou de la recruiter pe {{jobTitle}}",
      textBody:
        "Salut {{candidateName}},\n\nAi primit un mesaj nou de la recruiter pentru aplicarea ta la \"{{jobTitle}}\".\n\nDeschide conversatia: {{applicationsUrl}}",
      htmlBody:
        "<p>Salut {{candidateName}},</p><p>Ai primit un mesaj nou de la recruiter pentru aplicarea ta la <strong>{{jobTitle}}</strong>.</p><p>Deschide conversatia: <a href=\"{{applicationsUrl}}\">{{applicationsUrl}}</a></p>",
      isEnabled: true,
    },
  },
};

function resolveTemplateLocale(value?: string | null): Locale {
  return value === "ro" ? "ro" : "en";
}

const legacyDefaults: Record<EmailTemplateKey, TemplateDefault> = defaults.en;

function getDefaultTemplate(locale: Locale, key: EmailTemplateKey) {
  return defaults[locale]?.[key] || legacyDefaults[key];
}

function replaceTokens(input: string, vars: Record<string, string>) {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function resolveEmailTemplate(key: EmailTemplateKey, locale?: string | null) {
  const normalizedLocale = resolveTemplateLocale(locale);
  const dbTemplate = await prisma.emailTemplate.findUnique({
    where: { key_locale: { key, locale: normalizedLocale } },
  });
  const base = getDefaultTemplate(normalizedLocale, key);

  return {
    key,
    locale: normalizedLocale,
    subject: dbTemplate?.subject ?? base.subject,
    textBody: dbTemplate?.textBody ?? base.textBody,
    htmlBody: dbTemplate?.htmlBody ?? base.htmlBody ?? "",
    isEnabled: dbTemplate?.isEnabled ?? base.isEnabled ?? true,
  };
}

export async function renderEmailTemplate(key: EmailTemplateKey, vars: Record<string, string>, locale?: string | null) {
  const template = await resolveEmailTemplate(key, locale);
  return {
    isEnabled: template.isEnabled,
    subject: replaceTokens(template.subject, vars),
    text: replaceTokens(template.textBody, vars),
    html: template.htmlBody ? replaceTokens(template.htmlBody, vars) : undefined,
  };
}

export function getDefaultEmailTemplateCatalog(locale: Locale = "en") {
  return EMAIL_TEMPLATE_KEYS.map((key) => ({
    key,
    ...getDefaultTemplate(locale, key),
  }));
}
