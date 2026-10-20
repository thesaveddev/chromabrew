/**
 * Pure Polar → local decisions. No I/O and no env reads: every rule the
 * webhook handlers act on lives here so it can be tested in isolation
 * (src/lib/polar/derive.test.ts).
 */
import type { EntitlementKey } from "@/lib/entitlements";

/**
 * Structural shapes of Polar's payloads — the subset sync reads.
 * Deliberately not imported from the SDK: the webhook adapter hands its
 * payloads over structurally anyway, and keeping these local means the pure
 * rules stay testable without SDK version churn in fixtures.
 */
export interface PolarSubscriptionLike {
  id: string;
  status: string;
  amount: number;
  currency: string;
  recurring_interval: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  ends_at: string | null;
  product_id: string;
  customer: {
    id: string;
    external_id?: string | null;
    email?: string | null;
  };
}

export interface CustomerStateSubscriptionLike {
  id: string;
  status: string;
  amount: number;
  currency: string;
  recurring_interval: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end?: boolean;
  ends_at?: string | null;
  product_id: string;
}

export interface CustomerStateLike {
  id: string;
  email?: string | null;
  external_id?: string | null;
  active_subscriptions: CustomerStateSubscriptionLike[];
}

/** Everything the sync layer needs, normalised from either Polar shape. */
export interface SubscriptionFacts {
  polarId: string;
  customerPolarId: string;
  externalCustomerId: string | null;
  customerEmail: string | null;
  productId: string;
  status: string;
  interval: string;
  amount: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  endsAt: string | null;
}

export function factsFromPolar(sub: PolarSubscriptionLike): SubscriptionFacts {
  return {
    polarId: sub.id,
    customerPolarId: sub.customer.id,
    externalCustomerId: sub.customer.external_id ?? null,
    customerEmail: sub.customer.email ?? null,
    productId: sub.product_id,
    status: sub.status,
    interval: sub.recurring_interval,
    amount: sub.amount,
    currency: sub.currency,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    endsAt: sub.ends_at,
  };
}

export function factsFromCustomerState(
  state: CustomerStateLike,
  sub: CustomerStateSubscriptionLike,
): SubscriptionFacts {
  return {
    polarId: sub.id,
    customerPolarId: state.id,
    externalCustomerId: state.external_id ?? null,
    customerEmail: state.email ?? null,
    productId: sub.product_id,
    status: String(sub.status),
    interval: sub.recurring_interval,
    amount: sub.amount,
    currency: sub.currency,
    currentPeriodStart: sub.current_period_start ?? null,
    currentPeriodEnd: sub.current_period_end ?? null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    endsAt: sub.ends_at ?? null,
  };
}

/**
 * Statuses that carry paid access. `incomplete` (first payment not settled)
 * and `incomplete_expired` grant nothing; `unpaid`/`paused` grant nothing.
 * `canceled` is handled separately: Polar delivers it while paid time may
 * remain, so access follows the clock rather than the label.
 */
const ACCESS_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * The instant this subscription stops granting access — or null if it grants
 * nothing now. `ends_at` wins over `current_period_end` because it is set
 * exactly when the subscription is scheduled to stop.
 */
export function accessUntil(
  facts: SubscriptionFacts,
  now: Date,
): Date | null {
  const cancelled = facts.status === "canceled";
  if (!cancelled && !ACCESS_STATUSES.has(facts.status)) return null;

  const raw = cancelled ? (facts.endsAt ?? facts.currentPeriodEnd) : facts.currentPeriodEnd;
  if (!raw) return null;
  const end = new Date(raw);
  if (Number.isNaN(end.getTime())) return null;
  return end.getTime() > now.getTime() ? end : null;
}

export interface GrantPlan {
  /** Entitlement keys to hold while `until` has not passed. */
  entitlements: EntitlementKey[];
  /** When the grant lapses; always set when entitlements is non-empty. */
  until: Date | null;
}

const NO_GRANT: GrantPlan = { entitlements: [], until: null };

/**
 * Decide what a subscription grants right now. An unknown product grants
 * nothing (fail closed): revoking a product we never sold is correct.
 */
export function planForSubscription(
  facts: SubscriptionFacts,
  entitlementsByProduct: Record<string, readonly EntitlementKey[]>,
  now: Date,
): GrantPlan {
  const until = accessUntil(facts, now);
  if (!until) return NO_GRANT;
  const keys = entitlementsByProduct[facts.productId];
  if (!keys || keys.length === 0) return NO_GRANT;
  return { entitlements: [...keys], until };
}
