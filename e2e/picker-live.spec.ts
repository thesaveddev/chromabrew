import { test, expect } from "@playwright/test";

test("colour slots update preview tokens live", async ({ page }) => {
  await page.goto("/design-system");
  await expect(page.getByRole("heading", { name: /design system/i })).toBeVisible();

  // Open the secondary slot
  const secondarySlot = page.getByRole("button", { name: /^secondary/i });
  await secondarySlot.click();

  // The picker canvas + hue slider should be visible
  await expect(page.getByRole("slider", { name: "Hue" })).toBeVisible();
  const rgb = page.getByLabel("Red");
  await expect(rgb).toBeVisible();

  // Type a new RGB value and submit
  await rgb.fill("14");
  await page.getByLabel("Green").fill("165");
  const blue = page.getByLabel("Blue");
  await blue.fill("233");
  await blue.blur();

  // The secondary slot hex chip should now show the new colour
  await expect(page.getByText("#0EA5E9")).toBeVisible();
});
