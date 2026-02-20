import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { reportError } from "@/lib/error-reporting";

const payloadSchema = z.object({
  message: z.string().min(1).max(2000),
  name: z.string().max(240).optional(),
  stack: z.string().max(12000).optional(),
  digest: z.string().max(200).optional(),
  path: z.string().max(800).optional(),
  userAgent: z.string().max(500).optional(),
  metadata: z.string().max(4000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const session = await getCurrentSession();
    await reportError({
      source: "client",
      message: parsed.data.message,
      name: parsed.data.name,
      stack: parsed.data.stack,
      digest: parsed.data.digest,
      path: parsed.data.path,
      userAgent: parsed.data.userAgent || request.headers.get("user-agent"),
      metadata: parsed.data.metadata,
      userId: session?.user.id || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
