import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDefaultLocaleSetting, resolveLocale } from "@/lib/i18n";
import { shouldBlockForMaintenance } from "@/lib/maintenance";

export async function GET(request: NextRequest) {
  if (await shouldBlockForMaintenance()) {
    return NextResponse.json({ ok: false, error: "maintenance_mode" }, { status: 503 });
  }

  const fallbackLocale = await getDefaultLocaleSetting();
  const locale = resolveLocale(request.nextUrl.searchParams.get("locale") || fallbackLocale);
  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/";
  const url = new URL(redirectTo, request.url);
  const response = NextResponse.redirect(url);

  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const session = await getCurrentSession();
  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferredLocale: locale },
    }).catch(() => null);
  }

  return response;
}
