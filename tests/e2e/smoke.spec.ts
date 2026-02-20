import { test, expect } from "@playwright/test";

const adminEmail = process.env.ADMIN_EMAIL || "admin@nextjobs.local";
const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).toContainText(/nextjobs/i);
});

test("jobs page renders filters and list shell", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page).toHaveURL(/\/jobs/);
  await expect(page.locator("body")).toContainText(/job/i);
});

test("login page renders auth form", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator("input[name='email']")).toBeVisible();
  await expect(page.locator("input[name='password']")).toBeVisible();
});

test("admin user can log in and access admin dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name='email']", adminEmail);
  await page.fill("input[name='password']", adminPassword);
  await page.locator("form button").last().click();

  await expect(page).toHaveURL(/\/admin/);
  await expect(page.locator("body")).toContainText(/admin/i);
});
