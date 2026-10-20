/**
 * Webhook side effects: turn Polar events into the local access snapshot.
 *
 * Idempotent by construction — every write is keyed by Polar's ids, so
 * retries and out-of-order deliveries converge instead of duplicating
 * (Polar retries any handler that throws; these handlers must be safe to
 * re-run). Gates read the `Entitlement` table, never this module's API
 * calls, so a slow or missing webhook can only delay access, never extend
 * it beyond `expiresAt`.
 */
import { prisma } from "@/lib/db";
import type { EntitlementKey } from "@/lib/entitlements";
import { productEntitlements } from "./config";
import {
  factsFromCustomerState,
  factsFromPolar,
  planForSubscription,
  type CustomerStateLike,
  type GrantPlan,
  type PolarSubscriptionLike,
  type SubscriptionFacts,
} from "./derive";

function warn(message: string, context?: unknown): void {
  console.warn(`[polar] ${message}`, context ?? "");
}

/**
 * Make the stored grants match the plan: keys the plan dropped are removed,
 * keys it holds are upserted with the new expiry. Rows from other sources
 * (future manual grants) are left alone — this only owns `source: "polar"`.
 */
async function applyGrants(userId: string, plan: GrantPlan): Promise<void> {
  const wanted = new Set<string>(plan.entitlements);
  const existing = await prisma.entitlement.findMany({
    where: { userId, source: "polar" },
    select: { key: true },
  });
  const toDelete = existing.map((e) => e.key).filter((key) => !wanted.has(key));

  await prisma.$transaction([
    ...(toDelete.length > 0
      ? [
          prisma.entitlement.deleteMany({
            where: { userId, source: "polar", key: { in: toDelete } },
          }),
        ]
      : []),
    ...plan.entitlements.map((key) =>
      prisma.entitlement.upsert({
        where: { userId_key: { userId, key } },
        create: { userId, key, source: "polar", expiresAt: plan.until },
        update: { source: "polar", expiresAt: plan.until },
      }),
    ),
  ]);
}

function subscriptionRow(userId: string, facts: SubscriptionFacts) {
  const toDate = (value: string | null) => (value ? new Date(value) : null);
  return {
    polarId: facts.polarId,
    status: facts.status,
    productId: facts.productId,
    interval: facts.interval,
    amount: facts.amount,
    currency: facts.currency,
    currentPeriodStart: toDate(facts.currentPeriodStart),
    currentPeriodEnd: toDate(facts.currentPeriodEnd),
    cancelAtPeriodEnd: facts.cancelAtPeriodEnd,
    endsAt: toDate(facts.endsAt),
    userId,
  };
}

async function upsertCustomer(
  userId: string,
  polarId: string,
  email: string | null,
): Promise<void> {
  await prisma.polarCustomer.upsert({
    where: { userId },
    create: { userId, polarId, email },
    update: { polarId, ...(email ? { email } : {}) },
  });
}

/** Apply one subscription event (any of the subscription.* types). */
export async function applySubscription(
  sub: PolarSubscriptionLike,
): Promise<void> {
  const facts = factsFromPolar(sub);
  const userId = facts.externalCustomerId;
  if (!userId) {
    warn("subscription event has no customer external_id; ignoring", facts.polarId);
    return;
  }

  const plan = planForSubscription(facts, productEntitlements(), new Date());

  await upsertCustomer(userId, facts.customerPolarId, facts.customerEmail);

  const row = subscriptionRow(userId, facts);
  await prisma.polarSubscription.upsert({
    where: { polarId: facts.polarId },
    create: row,
    update: row,
  });

  await applyGrants(userId, plan);
}

/**
 * Rebuild the snapshot from Polar's authoritative customer state
 * (`customer.state_changed`). This is the belt to the webhook's braces: if
 * individual deliveries are lost or arrive out of order, the next state
 * event makes the local table agree with Polar again.
 */
export async function reconcileCustomerState(
  state: CustomerStateLike,
): Promise<void> {
  const userId = state.external_id ?? null;
  if (!userId) {
    warn("customer.state_changed without external_id; ignoring", state.id);
    return;
  }

  const now = new Date();
  const entitlementsByProduct = productEntitlements();

  // Union of grants across active subscriptions; per key keep the latest
  // expiry so a second subscription can only extend, never shorten.
  const desired = new Map<EntitlementKey, Date>();
  for (const sub of state.active_subscriptions) {
    const facts = factsFromCustomerState(state, sub);
    const plan = planForSubscription(facts, entitlementsByProduct, now);
    for (const key of plan.entitlements) {
      if (!plan.until) continue;
      const previous = desired.get(key);
      if (!previous || plan.until.getTime() > previous.getTime()) {
        desired.set(key, plan.until);
      }
    }
  }

  await upsertCustomer(userId, state.id, state.email ?? null);

  const rows = [...desired.entries()].map(([key, expiresAt]) => ({
    userId,
    key,
    source: "polar",
    expiresAt,
  }));

  await prisma.$transaction([
    prisma.entitlement.deleteMany({ where: { userId, source: "polar" } }),
    ...(rows.length > 0 ? [prisma.entitlement.createMany({ data: rows })] : []),
  ]);
}
