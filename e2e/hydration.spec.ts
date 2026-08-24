import { test, expect } from "@playwright/test";

/**
 * Shared URLs (?primary=…) used to hydrate-mismatch: the server rendered
 * the default palette while the first client render adopted URL params.
 * Config must be adopted strictly after hydration.
 */
test("shared URL adopts params without hydration errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/design-system?primary=E684D4");

  // The toolbar identity strip reflects the shared colour…
  await expect(
    page.getByRole("heading", { name: /Design system #E684D4/i }),
  ).toBeVisible({ timeout: 15_000 });
  // …and hydration completed cleanly.
  await page.waitForTimeout(1_500);
  expect(errors.join(" | ")).toBe("");
});
