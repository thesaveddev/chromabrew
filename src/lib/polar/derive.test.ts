import { describe, expect, it } from "vitest";
import type { EntitlementKey } from "@/lib/entitlements";
import {
  accessUntil,
  factsFromCustomerState,
  factsFromPolar,
  planForSubscription,
  type SubscriptionFacts,
} from "./derive";

const NOW = new Date("2026-10-20T12:00:00Z");
// Full ISO form, so string comparisons can use these verbatim against
// Date.toISOString() output.
const FUTURE = "2026-11-20T12:00:00.000Z";
const PAST = "2026-09-20T12:00:00.000Z";

const PRODUCT = "prod_monthly_1";
const ENTITLEMENTS: Record<string, readonly EntitlementKey[]> = {
  [PRODUCT]: ["pro", "ai"],
};

function facts(overrides: Partial<SubscriptionFacts> = {}): SubscriptionFacts {
  return {
    polarId: "sub_1",
    customerPolarId: "cus_1",
    externalCustomerId: "user_1",
    customerEmail: "buyer@example.com",
    productId: PRODUCT,
    status: "active",
    interval: "month",
    amount: 900,
    currency: "usd",
    currentPeriodStart: PAST,
    currentPeriodEnd: FUTURE,
    cancelAtPeriodEnd: false,
    endsAt: null,
    ...overrides,
  };
}

describe("accessUntil", () => {
  it("grants through the period on active/trialing/past_due", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      const until = accessUntil(facts({ status }), NOW);
      expect(until?.toISOString()).toBe(FUTURE);
    }
  });

  it("grants nothing when the period has already run out", () => {
    expect(accessUntil(facts({ currentPeriodEnd: PAST }), NOW)).toBeNull();
  });

  it("grants nothing before payment settles or when broken", () => {
    for (const status of [
      "incomplete",
      "incomplete_expired",
      "unpaid",
      "paused",
      "weird",
    ]) {
      expect(accessUntil(facts({ status }), NOW)).toBeNull();
    }
  });

  it("cancelled subs keep access until ends_at, not a millisecond longer", () => {
    const cancelled = facts({
      status: "canceled",
      cancelAtPeriodEnd: true,
      endsAt: FUTURE,
    });
    expect(accessUntil(cancelled, NOW)?.toISOString()).toBe(FUTURE);
    expect(accessUntil({ ...cancelled, endsAt: PAST }, NOW)).toBeNull();
  });

  it("cancelled falls back to current_period_end and handles missing times", () => {
    expect(
      accessUntil(
        facts({ status: "canceled", endsAt: null, currentPeriodEnd: FUTURE }),
        NOW,
      )?.toISOString(),
    ).toBe(FUTURE);
    expect(
      accessUntil(
        facts({ status: "canceled", endsAt: null, currentPeriodEnd: null }),
        NOW,
      ),
    ).toBeNull();
    expect(accessUntil(facts({ currentPeriodEnd: "not-a-date" }), NOW)).toBeNull();
  });
});

describe("planForSubscription", () => {
  it("grants the product's entitlements until the period end", () => {
    const plan = planForSubscription(facts(), ENTITLEMENTS, NOW);
    expect(plan.entitlements).toEqual(["pro", "ai"]);
    expect(plan.until?.toISOString()).toBe(FUTURE);
  });

  it("fails closed on an unknown product, however active", () => {
    const plan = planForSubscription(
      facts({ productId: "prod_something_else" }),
      ENTITLEMENTS,
      NOW,
    );
    expect(plan).toEqual({ entitlements: [], until: null });
  });

  it("grants nothing without paid time even for a known product", () => {
    const plan = planForSubscription(
      facts({ status: "incomplete" }),
      ENTITLEMENTS,
      NOW,
    );
    expect(plan).toEqual({ entitlements: [], until: null });
  });

  it("treats an explicitly empty entitlement mapping as no grant", () => {
    const plan = planForSubscription(facts(), { [PRODUCT]: [] }, NOW);
    expect(plan).toEqual({ entitlements: [], until: null });
  });
});

describe("facts mapping", () => {
  it("pulls the fields sync depends on out of a Polar subscription", () => {
    const polar = {
      id: "sub_9",
      status: "active",
      amount: 9000,
      currency: "usd",
      recurring_interval: "year",
      current_period_start: PAST,
      current_period_end: FUTURE,
      cancel_at_period_end: false,
      ends_at: null,
      product_id: "prod_year",
      customer: {
        id: "cus_2",
        external_id: "user_2",
        email: "a@b.c",
      },
    } as unknown as Parameters<typeof factsFromPolar>[0];

    expect(factsFromPolar(polar)).toEqual({
      polarId: "sub_9",
      customerPolarId: "cus_2",
      externalCustomerId: "user_2",
      customerEmail: "a@b.c",
      productId: "prod_year",
      status: "active",
      interval: "year",
      amount: 9000,
      currency: "usd",
      currentPeriodStart: PAST,
      currentPeriodEnd: FUTURE,
      cancelAtPeriodEnd: false,
      endsAt: null,
    });
  });

  it("builds the same facts from a customer-state subscription", () => {
    const state = {
      id: "cus_3",
      external_id: "user_3",
      email: "state@b.c",
    } as unknown as Parameters<typeof factsFromCustomerState>[0];
    const sub = {
      id: "sub_3",
      status: "active",
      amount: 900,
      currency: "usd",
      recurring_interval: "month",
      current_period_start: PAST,
      current_period_end: FUTURE,
      cancel_at_period_end: false,
      ends_at: null,
      product_id: "prod_monthly_1",
    } as unknown as Parameters<typeof factsFromCustomerState>[1];

    const mapped = factsFromCustomerState(state, sub);
    expect(mapped.externalCustomerId).toBe("user_3");
    expect(mapped.customerPolarId).toBe("cus_3");
    expect(mapped.customerEmail).toBe("state@b.c");
    expect(mapped.productId).toBe("prod_monthly_1");
    expect(mapped.status).toBe("active");
  });
});
