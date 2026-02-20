import { test, expect } from "@playwright/test";

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

