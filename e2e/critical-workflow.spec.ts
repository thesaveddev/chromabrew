import { expect, test } from "@playwright/test";

/**
 * Critical Phase 1 workflow:
 *   visit → enter #47003A → generate → scale/palette/tokens →
 *   light/dark → accessibility → previews → exports → share URL.
 */
test("one colour becomes a full design system", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Turn one colour into an entire design system",
  );

  // Enter the spec's example colour and generate.
  const hexField = page.getByPlaceholder(/#47003A, rgb/i).first();
  await hexField.fill("#47003A");
  await hexField.press("Enter");

  await expect(page).toHaveURL(/\/design-system\?primary=47003[Aa]/);
  await expect(page.getByRole("heading", { name: /design system #47003A/i })).toBeVisible();

  // Scale panel shows the pinned source step.
  await expect(page.getByText("950").first()).toBeVisible();

  // Semantic tokens table present for both modes.
  await expect(page.getByText("--primary-hover").first()).toBeVisible();

  // Accessibility report renders with measured ratios.
  await expect(page.getByText(/Contrast ratio|AA normal|Primary button/i).first()).toBeVisible();
  await expect(page.getByText(":1").first()).toBeVisible();

  // Switch to dark mode — preview re-themes via tokens.
  await page.getByRole("tab", { name: "Dark" }).click();

  // Switch preview environments.
  for (const label of ["Marketing site", "Ecommerce", "Mobile app", "SaaS dashboard"]) {
    await page.getByRole("tab", { name: label }).click();
  }

  // Export tabs produce code and the share button copies a URL.
  await page.getByRole("tab", { name: "Tailwind CSS v4" }).click();
  await expect(page.getByText("@theme inline {")).toBeVisible();
  await page.getByRole("tab", { name: "shadcn/ui" }).click();
  await expect(page.getByText("--card: oklch(", { exact: false }).first()).toBeVisible();

  await page.getByRole("button", { name: "Share link" }).click();
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();

  // A shared URL must restore the system after reload.
  await page.reload();
  await expect(page.getByRole("heading", { name: /design system #47003A/i })).toBeVisible();

  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});

test("tool pages render their interactive shells", async ({ page }) => {
  await page.goto("/tools/contrast-checker");
  await expect(page.getByRole("cell", { name: "AA normal text", exact: true })).toBeVisible();
  await expect(page.getByText(/21\.00:1|4\.54:1|\d+\.\d{2}:1/).first()).toBeVisible();

  await page.goto("/tools/shade-generator");
  await expect(page.getByRole("columnheader", { name: "OKLCH" })).toBeVisible();

  await page.goto("/tools");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Free colour");
});
