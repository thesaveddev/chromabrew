/**
 * Entitlements — shared constants for free vs pro feature gating.
 * No server-only imports — safe for client bundles.
 */

export type PlanType = "free" | "pro";

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to generate a design system from one color.",
    features: [
      "Full design system generator",
      "All color controls and refinement sliders",
      "Light and dark theme preview",
      "WCAG accessibility checks",
      "CSS variables export",
      "JSON (DTCG) export",
      "Tailwind CSS v4 export",
      "shadcn/ui theme export",
      "Palette history (12 saved)",
      "10 standalone color tools",
      "Shareable URLs",
    ],
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    price: "$9",
    period: "month",
    annualPrice: "$90",
    annualPeriod: "year",
    annualNote: "2 months free",
    description: "For teams that ship design systems at scale.",
    features: [
      "Everything in Free",
      "Unlimited project saving",
      "Unlimited palette history",
      "All 13 export adapters (Figma, Flutter, iOS, Android, MUI, Ant Design, Chakra)",
      "Project version history",        "Team sharing and collaboration (invite viewers and editors to your projects)",
        "Emailed site reports — every watch emails its report to up to 3 addresses",
      "AI features, included as they ship",
      "Priority support",
    ],
  },
} as const;

/** Free-tier export adapter IDs (no payment required). */
export const FREE_ADAPTERS = [
  "css",
  "json",
  "tailwind",
  "shadcn",
] as const;

/** Maximum palette history entries for free tier. */
export const FREE_HISTORY_LIMIT = 12;

/**
 * Check if an export adapter requires pro.
 * Used for visual gating (show lock icon + upgrade CTA).
 */
export function adapterRequiresPro(adapterId: string): boolean {
  return !(FREE_ADAPTERS as readonly string[]).includes(adapterId);
}

/** Check if history is at the free-tier cap. */
export function isHistoryCapped(currentCount: number): boolean {
  return currentCount >= FREE_HISTORY_LIMIT;
}

/* ---- entitlement keys -------------------------------------------------- */

/**
 * The entitlements the app recognises. `pro` unlocks paid-only product
 * surface (adapters, unlimited history/projects); `ai` gates AI features as
 * they ship. Both arrive with the Pro subscription, monthly or annual, but
 * stay separate keys so AI can later be metered or sold without touching
 * the pro gate.
 */
export type EntitlementKey = "pro" | "ai";

export const ENTITLEMENT_KEYS = ["pro", "ai"] as const;

/** A stored grant. `expiresAt: null` is perpetual; a date bounds it. */
export interface EntitlementRecord {
  key: string;
  expiresAt: Date | null;
}

/**
 * Access follows the clock: a grant counts while it has not expired, and a
 * cancelled subscription stays entitled until the paid period runs out
 * (webhooks set `expiresAt` to that moment rather than revoking eagerly).
 */
export function entitlementIsActive(
  entitlement: EntitlementRecord,
  now: Date = new Date(),
): boolean {
  return (
    entitlement.expiresAt === null || entitlement.expiresAt.getTime() > now.getTime()
  );
}

/** Derive the plan from active entitlement rows (the local snapshot). */
export function planForEntitlements(
  entitlements: readonly EntitlementRecord[],
  now: Date = new Date(),
): PlanType {
  return entitlements.some(
    (e) => e.key === "pro" && entitlementIsActive(e, now),
  )
    ? "pro"
    : "free";
}
