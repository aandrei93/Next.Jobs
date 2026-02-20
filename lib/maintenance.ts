import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function shouldBlockForMaintenance() {
  const [settings, session] = await Promise.all([
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    getCurrentSession(),
  ]);

  if (!settings.maintenanceMode) {
    return false;
  }

  if (session?.user.role === "ADMIN") {
    return false;
  }

  if (settings.maintenanceScope === "ALL_NON_ADMIN") {
    return true;
  }

  return !session;
}
