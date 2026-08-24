import { expect, test } from "@playwright/test";

const email = `e2e-${Date.now()}@chromabrew.test`;
const password = "password123";

test("email sign-up creates account and signs in", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/projects/, { timeout: 30000 });
});

test("email sign-in works after logout", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/projects/, { timeout: 30000 });
});
