import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { reportError } from "@/lib/error-reporting";
import { type EmailTemplateKey, renderEmailTemplate } from "@/lib/email-templates";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(input: SendEmailInput) {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPassword: true,
      smtpFrom: true,
      smtpSecure: true,
    },
  });

  if (!settings?.smtpHost || !settings.smtpPort || !settings.smtpFrom) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth:
      settings.smtpUser && settings.smtpPassword
        ? {
            user: settings.smtpUser,
            pass: settings.smtpPassword,
          }
        : undefined,
  });

  const fromDomain = settings.smtpFrom.split("@")[1] || "";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const listUnsubscribeMailto = fromDomain ? `<mailto:unsubscribe@${fromDomain}>` : "";
  const listUnsubscribeUrl = `<${appUrl}/privacy>`;

  let lastError: unknown = null;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await transporter.sendMail({
        from: settings.smtpFrom,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        headers: {
          "X-Auto-Response-Suppress": "All",
          "X-Entity-Ref-ID": randomUUID(),
          "List-Unsubscribe": [listUnsubscribeMailto, listUnsubscribeUrl].filter(Boolean).join(", "),
        },
      });
      return true;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      }
    }
  }

  await reportError({
    source: "server",
    name: "EmailDeliveryFailed",
    message: "SMTP delivery failed after retries.",
    path: "lib/email.sendEmail",
    metadata: JSON.stringify({
      to: input.to,
      subject: input.subject,
      error: lastError instanceof Error ? lastError.message : "unknown",
    }),
  });

  return false;
}

export async function sendTemplatedEmail(input: {
  to: string;
  templateKey: EmailTemplateKey;
  variables: Record<string, string>;
  locale?: string | null;
}) {
  const rendered = await renderEmailTemplate(input.templateKey, input.variables, input.locale);
  if (!rendered.isEnabled) {
    return false;
  }

  return sendEmail({
    to: input.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}
