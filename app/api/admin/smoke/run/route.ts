import { exec } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { completeAdminTask, createAdminTask, failAdminTask, startAdminTask } from "@/lib/admin-governance";
import { reportError } from "@/lib/error-reporting";

const execAsync = promisify(exec);

export async function POST() {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const smokeCommand = process.platform === "win32"
    ? "npm run test:e2e -- --reporter=line"
    : "npm run test:e2e -- --reporter=line";
  const task = await createAdminTask({
    createdById: session.user.id,
    type: "SMOKE_TEST",
    input: { baseUrl },
  });

  try {
    await startAdminTask(task.id);
    const { stdout, stderr } = await execAsync(smokeCommand, {
      cwd: process.cwd(),
      timeout: 5 * 60 * 1000,
      maxBuffer: 1024 * 1024 * 8,
      env: {
        ...process.env,
        E2E_BASE_URL: baseUrl,
        CI: "1",
      },
    });

    const output = `${stdout}\n${stderr}`.trim().slice(-30000);
    await completeAdminTask(task.id, { output });
    return NextResponse.json({ ok: true, output });
  } catch (error) {
    const stdErr = typeof error === "object" && error && "stderr" in error ? String((error as { stderr?: string }).stderr || "") : "";
    const stdOut = typeof error === "object" && error && "stdout" in error ? String((error as { stdout?: string }).stdout || "") : "";
    const output = `${stdOut}\n${stdErr}`.trim().slice(-30000);
    await failAdminTask(task.id, error instanceof Error ? error.message : "smoke_failed", { output });

    await reportError({
      source: "server",
      name: "AdminSmokeFailed",
      message: error instanceof Error ? error.message : "Smoke tests failed.",
      path: "/api/admin/smoke/run",
      userId: session.user.id,
      metadata: output ? JSON.stringify({ output }) : null,
    });

    return NextResponse.json({ ok: false, error: "smoke_failed", output }, { status: 500 });
  }
}
