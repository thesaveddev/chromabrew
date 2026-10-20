import { describe, expect, it, beforeEach } from "vitest";
import {
  AI_SUGGESTIONS_PER_MINUTE,
  AI_SUGGESTIONS_PER_MINUTE_PRO,
  bucketAllows,
  checkAiRateLimit,
  resetAiRateLimits,
} from "./rate-limit";

describe("bucketAllows", () => {
  it("allows traffic under the limit", () => {
    expect(bucketAllows([0, 1000, 2000], 3000).allowed).toBe(true);
  });

  it("refuses the request past the limit with a retry hint", () => {
    const now = 60_000;
    const full = Array.from({ length: AI_SUGGESTIONS_PER_MINUTE }, () => now - 1000);
    const decision = bucketAllows(full, now);
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
    expect(decision.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("forgets timestamps outside the window", () => {
    const now = 120_000;
    const stale = Array.from({ length: AI_SUGGESTIONS_PER_MINUTE }, () => 0);
    expect(bucketAllows(stale, now).allowed).toBe(true);
  });
});

describe("checkAiRateLimit", () => {
  beforeEach(() => resetAiRateLimits());

  it("allows the first burst then refuses", () => {
    const now = Date.now();
    for (let i = 0; i < AI_SUGGESTIONS_PER_MINUTE; i++) {
      expect(checkAiRateLimit("1.2.3.4", now).allowed).toBe(true);
    }
    const refused = checkAiRateLimit("1.2.3.4", now);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const now = Date.now();
    for (let i = 0; i < AI_SUGGESTIONS_PER_MINUTE; i++) {
      checkAiRateLimit("1.2.3.4", now);
    }
    expect(checkAiRateLimit("5.6.7.8", now).allowed).toBe(true);
  });

  it("flips the decision when the caller holds the pro limit", () => {
    const now = Date.now();
    for (let i = 0; i < AI_SUGGESTIONS_PER_MINUTE; i++) {
      checkAiRateLimit("9.9.9.9", now);
    }
    // Free cap reached: refused at the standard limit…
    expect(checkAiRateLimit("9.9.9.9", now).allowed).toBe(false);
    // …but the same window passes under the pro cap (the ai entitlement).
    expect(
      checkAiRateLimit("9.9.9.9", now, AI_SUGGESTIONS_PER_MINUTE_PRO).allowed,
    ).toBe(true);
    expect(AI_SUGGESTIONS_PER_MINUTE_PRO).toBeGreaterThan(
      AI_SUGGESTIONS_PER_MINUTE,
    );
  });
});
