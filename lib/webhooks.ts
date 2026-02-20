import { prisma } from "@/lib/db";

export async function sendWebhookEvent(event: string, payload: Record<string, unknown>) {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { webhookUrl: true, webhookSecret: true },
  });

  if (!settings?.webhookUrl) {
    return;
  }

  try {
    await fetch(settings.webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(settings.webhookSecret ? { "x-webhook-secret": settings.webhookSecret } : {}),
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        payload,
      }),
    });
  } catch {
    // Intentionally ignored so primary flow isn't blocked by webhook failures.
  }
}
