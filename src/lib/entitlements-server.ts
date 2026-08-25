/**
 * Server-only entitlements — queries the database for subscription status.
 * NEVER import this from client components.
 */

import { prisma } from "@/lib/db";
import type { PlanType } from "@/lib/entitlements";

/**
 * Fetch the user's active plan from the Subscription table.
 * Returns "pro" if they have an active, non-cancelled subscription,
 * otherwise "free".
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: { gt: new Date() },
    },
  });
  return sub ? "pro" : "free";
}
