/**
 * Entitlements — defines which features are free vs pro.
 *
 * Currently all users are on the free plan. When Stripe is integrated,
 * the user's plan will be fetched from the database and this module
 * will return the correct feature set.
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
    description: "For teams that ship design systems at scale.",
    features: [
      "Everything in Free",
      "Unlimited project saving",
      "Unlimited palette history",
      "All 13 export adapters (Figma, Flutter, iOS, Android, MUI, Ant Design, Chakra)",
      "Project version history",
      "Team sharing and collaboration",
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
