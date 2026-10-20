/**
 * Polar billing configuration.
 *
 * Product IDs live in the environment because they belong to the Polar
 * catalog — create them with `npm run billing:setup` (docs/BILLING_SETUP.md).
 * Monthly and annual are two separate Polar products (Polar's model is one
 * billing interval per product); both grant exactly the same entitlements,
 * so the interval only changes the price, never what the buyer gets.
 */
import type { EntitlementKey } from "@/lib/entitlements";

export type BillingInterval = "month" | "year";

export const POLAR_ENVIRONMENT: "production" | "sandbox" =
  process.env.POLAR_ENVIRONMENT === "sandbox" ? "sandbox" : "production";

const MONTHLY_ID = process.env.POLAR_PRODUCT_PRO_MONTHLY?.trim() ?? "";
const ANNUAL_ID = process.env.POLAR_PRODUCT_PRO_ANNUAL?.trim() ?? "";

/** What Pro grants. Separate keys so AI can be metered or split off later. */
export const PRO_ENTITLEMENTS: readonly EntitlementKey[] = ["pro", "ai"];

/** Product id → entitlement keys. Unknown products map to nothing. */
export function productEntitlements(): Record<string, readonly EntitlementKey[]> {
  const map: Record<string, readonly EntitlementKey[]> = {};
  if (MONTHLY_ID) map[MONTHLY_ID] = PRO_ENTITLEMENTS;
  if (ANNUAL_ID) map[ANNUAL_ID] = PRO_ENTITLEMENTS;
  return map;
}

/** Both catalog IDs must be set before checkout/portal may run. */
export function billingConfigured(): boolean {
  return Boolean(MONTHLY_ID && ANNUAL_ID);
}

export function productIdForInterval(interval: BillingInterval): string {
  return interval === "year" ? ANNUAL_ID : MONTHLY_ID;
}

export function intervalForProduct(productId: string): BillingInterval | null {
  if (MONTHLY_ID && productId === MONTHLY_ID) return "month";
  if (ANNUAL_ID && productId === ANNUAL_ID) return "year";
  return null;
}
