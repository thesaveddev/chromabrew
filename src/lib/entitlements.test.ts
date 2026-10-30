import { describe, expect, it } from "vitest";
import {
  PLANS,
  adapterRequiresPro,
  entitlementIsActive,
  isHistoryCapped,
  planForEntitlements,
} from "./entitlements";

const NOW = new Date("2026-10-19T12:00:00Z");
const FUTURE = new Date("2026-11-19T12:00:00Z");
const PAST = new Date("2026-09-19T12:00:00Z");

describe("entitlementIsActive", () => {
  it("treats a null expiry as perpetual", () => {
    expect(entitlementIsActive({ key: "pro", expiresAt: null }, NOW)).toBe(true);
  });

  it("is active before the expiry and inactive at or after it", () => {
    expect(entitlementIsActive({ key: "pro", expiresAt: FUTURE }, NOW)).toBe(
      true,
    );
    expect(entitlementIsActive({ key: "pro", expiresAt: PAST }, NOW)).toBe(
      false,
    );
    expect(entitlementIsActive({ key: "pro", expiresAt: NOW }, NOW)).toBe(false);
  });
});

describe("planForEntitlements", () => {
  it("is free with no entitlements", () => {
    expect(planForEntitlements([], NOW)).toBe("free");
  });

  it("is pro on an active pro grant", () => {
    expect(
      planForEntitlements([{ key: "pro", expiresAt: FUTURE }], NOW),
    ).toBe("pro");
  });

  it("drops to free when the grant has expired", () => {
    expect(planForEntitlements([{ key: "pro", expiresAt: PAST }], NOW)).toBe(
      "free",
    );
  });

  it("stays free on ai alone — AI is not Pro", () => {
    expect(
      planForEntitlements([{ key: "ai", expiresAt: FUTURE }], NOW),
    ).toBe("free");
  });
});

describe("adapterRequiresPro", () => {
  it("keeps the free five (incl. Figma) free and gates the rest", () => {
    for (const id of ["css", "json", "tailwind", "shadcn", "figma"]) {
      expect(adapterRequiresPro(id)).toBe(false);
    }
    for (const id of ["flutter", "ios-swift", "zip", "mui"]) {
      expect(adapterRequiresPro(id)).toBe(true);
    }
  });
});

describe("isHistoryCapped", () => {
  it("caps at twelve", () => {
    expect(isHistoryCapped(11)).toBe(false);
    expect(isHistoryCapped(12)).toBe(true);
  });
});

describe("PLANS.pro", () => {
  it("carries both cadences and the AI promise the pricing page renders", () => {
    expect(PLANS.pro.price).toBe("$9");
    expect(PLANS.pro.annualPrice).toBe("$90");
    expect(
      PLANS.pro.features.some((f) => f.toLowerCase().includes("ai")),
    ).toBe(true);
  });
});
