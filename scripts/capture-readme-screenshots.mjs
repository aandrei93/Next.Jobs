import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000";
const externalServer = process.env.SCREENSHOT_EXTERNAL === "1";
const outDir = path.join(process.cwd(), "docs", "screenshots");
const adminEmail = process.env.ADMIN_EMAIL || "admin@nextjobs.local";
const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

const consentValue = JSON.stringify({
  necessary: true,
  analytics: false,
  marketing: false,
  ts: Date.now(),
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }
    await wait(1000);
  }
  throw new Error(`Server did not start in ${timeoutMs}ms: ${url}`);
}

async function isServerUp(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });

  const healthUrl = `${baseUrl}/api/health`;
  const hasExternalServer = externalServer || (await isServerUp(healthUrl));
  const dev = hasExternalServer
    ? null
    : spawn("npm", ["run", "dev"], {
        cwd: process.cwd(),
        stdio: "inherit",
        shell: true,
        env: process.env,
      });

  try {
    if (!hasExternalServer) {
      await waitForServer(healthUrl, 120_000);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 900 },
    });

    await context.addInitScript(
      ({ value }) => {
        window.localStorage.setItem("nextjobs_privacy_consent_v1", value);
      },
      { value: consentValue }
    );

    const page = await context.newPage();

    const shot = async (fileName) => {
      await page.addStyleTag({
        content: `* { font-family: Arial, sans-serif !important; }`,
      });
      await page.screenshot({ path: path.join(outDir, fileName), fullPage: true });
    };

    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await shot("home.png");

    await page.goto(`${baseUrl}/jobs`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await shot("jobs.png");

    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.fill("input[name='email']", adminEmail);
    await page.fill("input[name='password']", adminPassword);
    await page.locator("form button").last().click();
    await page.waitForURL(/\/admin/, { timeout: 30_000 });
    await page.waitForTimeout(1000);
    await shot("admin-dashboard.png");

    await page.goto(`${baseUrl}/admin/jobs`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await shot("admin-jobs.png");

    await page.goto(`${baseUrl}/admin/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await shot("admin-settings.png");

    await browser.close();
    console.log("Screenshots generated in docs/screenshots");
  } finally {
    if (dev) {
      dev.kill("SIGTERM");
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
