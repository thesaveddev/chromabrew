import { describe, expect, it } from "vitest";

import {
  createShareToken,
  getSharedReport,
  isValidShareToken,
  resolveSharedScreenshot,
  sharePath,
  shareUrl,
  sharedScreenshotUrl,
} from "./share";

/**
 * The parts of sharing that must hold without a database: the token is
 * unguessable and well-formed, the links it builds point at the token and never
 * at a scan id, and anything that is not a well-formed token is refused before
 * it can reach a query.
 */

describe("createShareToken", () => {
  it("produces a URL-safe token of the advertised width", () => {
    const token = createShareToken();
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    // 24 random bytes base64url-encoded: no padding, no characters that need
    // escaping in a URL or a chat message.
    expect(token).not.toContain("=");
    expect(token).not.toContain("+");
    expect(token).not.toContain("/");
  });

  it("does not repeat itself", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => createShareToken()));
    expect(tokens.size).toBe(1000);
  });

  it("is accepted by its own validator", () => {
    expect(isValidShareToken(createShareToken())).toBe(true);
  });
});

describe("isValidShareToken", () => {
  it("refuses empty, short, long and non-URL-safe tokens", () => {
    const token = createShareToken();
    expect(isValidShareToken("")).toBe(false);
    expect(isValidShareToken(token.slice(0, 31))).toBe(false);
    expect(isValidShareToken(`${token}a`)).toBe(false);
    expect(isValidShareToken("../".repeat(11))).toBe(false);
    expect(isValidShareToken(`${token.slice(0, 31)}/`)).toBe(false);
    expect(isValidShareToken(`${token.slice(0, 31)}+`)).toBe(false);
    expect(isValidShareToken("' OR 1=1 --")).toBe(false);
  });
});

describe("share links", () => {
  it("paths under /r with the token as the only identifier", () => {
    const token = createShareToken();
    expect(sharePath(token)).toBe(`/r/${token}`);
  });

  it("builds an absolute URL on the configured site", () => {
    const token = createShareToken();
    const url = new URL(shareUrl(token));
    expect(url.protocol).toBe("https:");
    expect(url.pathname).toBe(sharePath(token));
    expect(url.search).toBe("");
  });

  it("points screenshots at the token, not at a scan id", () => {
    const token = createShareToken();
    const pageId = "clx8fk2q00000abcd1234efgh";
    const src = sharedScreenshotUrl(token, { id: pageId });
    expect(src).toBe(`/r/${token}/screenshot?page=${pageId}`);
    expect(src.startsWith(sharePath(token))).toBe(true);
    // The owner's route is scan-scoped; a shared page must never use it.
    expect(src).not.toContain("/api/audit/scan/");
  });
});

describe("a token that is not well-formed", () => {
  /**
   * These are deliberately called without a database present: a malformed token
   * must be refused by its shape alone, before any query is attempted.
   */
  it("resolves to no report", async () => {
    await expect(getSharedReport("nope")).resolves.toBeNull();
    await expect(getSharedReport("")).resolves.toBeNull();
    await expect(getSharedReport("../etc/passwd")).resolves.toBeNull();
  });

  it("resolves to no screenshot", async () => {
    await expect(resolveSharedScreenshot("nope", "page-id")).resolves.toBeNull();
  });
});
