/**
 * Server-only entitlements — reads the local snapshot that webhook
 * reconciliation writes (src/lib/polar/sync.ts). NEVER import this from
 * client components.
 *
 * Gates never call Polar: a delayed webhook can only postpone access, and
 * `expiresAt` bounds what a missed revocation could leak.
 */
import { prisma } from "@/lib/db";
import {
  ENTITLEMENT_KEYS,
  entitlementIsActive,
  planForEntitlements,
  type EntitlementKey,
  type PlanType,
} from "@/lib/entitlements";

const KNOWN_KEYS = new Set<string>(ENTITLEMENT_KEYS);

/** Active, recognised entitlement keys for a user. */
export async function getUserEntitlements(
  userId: string,
  now: Date = new Date(),
): Promise<EntitlementKey[]> {
  const rows = await prisma.entitlement.findMany({
    where: { userId },
    select: { key: true, expiresAt: true },
  });
  return rows
    .filter((row) => KNOWN_KEYS.has(row.key) && entitlementIsActive(row, now))
    .map((row) => row.key as EntitlementKey);
}

/** Free vs Pro from the snapshot (used by /api/billing/plan). */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const rows = await prisma.entitlement.findMany({
    where: { userId },
    select: { key: true, expiresAt: true },
  });
  return planForEntitlements(rows);
}

/**
 * The check feature code should use when AI (or any paid capability) ships:
 * `if (!(await hasEntitlement(userId, "ai"))) …`. One indexed read, expiry
 * evaluated locally.
 */
export async function hasEntitlement(
  userId: string,
  key: EntitlementKey,
  now: Date = new Date(),
): Promise<boolean> {
  const row = await prisma.entitlement.findUnique({
    where: { userId_key: { userId, key } },
    select: { key: true, expiresAt: true },
  });
  return row !== null && entitlementIsActive(row, now);
}

export interface BillingSubscriptionSummary {
  status: string;
  interval: string;
  amount: number;
  currency: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingSummary {
  plan: PlanType;
  entitlements: EntitlementKey[];
  subscription: BillingSubscriptionSummary | null;
}

/**
 * Everything the account billing UI needs in one round trip: the plan, the
 * active entitlement keys, and the Polar subscription row (for renewal and
 * cancellation display). Newest row wins if several somehow exist.
 */
export async function getBillingSummary(
  userId: string,
  now: Date = new Date(),
): Promise<BillingSummary> {
  const [entitlements, subscription] = await Promise.all([
    getUserEntitlements(userId, now),
    prisma.polarSubscription.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        status: true,
        interval: true,
        amount: true,
        currency: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    }),
  ]);
  return {
    plan: entitlements.includes("pro") ? "pro" : "free",
    entitlements,
    subscription,
  };
}
