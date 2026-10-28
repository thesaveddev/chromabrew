import { describe, expect, it } from "vitest";

import { FetchError } from "./analyzer";
import { DISCOVER_PAGE_LIMIT, discoverPages } from "./discover";
import { UrlValidationError, type HostResolver } from "./url-validator";

const PUBLIC_RESOLVER: HostResolver = async () => ["93.184.216.34"];

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const SITE = `<html><body>
  <a href="/pricing">Pricing</a>
  <a href="/about">About us</a>
  <a href="https://external.example/elsewhere">Elsewhere</a>
  <a href="/pricing">Pricing repeated</a>
</body></html>`;

describe("discoverPages", () => {
  it("lists the pages a crawl would visit, with link text", async () => {
    const result = await discoverPages("https://example.com/", {
      resolve: PUBLIC_RESOLVER,
      fetchImpl: (async () => htmlResponse(SITE)) as typeof fetch,
    });

    expect(result.seedUrl).toBe("https://example.com/");
    expect(result.pages).toEqual([
      { url: "https://example.com/pricing", text: "Pricing" },
      { url: "https://example.com/about", text: "About us" },
    ]);
  });

  it("caps the offer at the scope budget", async () => {
    const links = Array.from(
      { length: DISCOVER_PAGE_LIMIT + 5 },
      (_, i) => `<a href="/p${i}">Page ${i}</a>`,
    ).join("");
    const result = await discoverPages("https://example.com/", {
      resolve: PUBLIC_RESOLVER,
      fetchImpl: (async () => htmlResponse(`<html><body>${links}</body></html>`)) as typeof fetch,
    });

    expect(result.pages.length).toBe(DISCOVER_PAGE_LIMIT);
  });

  it("reports an error status with a showable message", async () => {
    await expect(
      discoverPages("https://example.com/", {
        resolve: PUBLIC_RESOLVER,
        fetchImpl: (async () => htmlResponse("nope", 404)) as typeof fetch,
      }),
    ).rejects.toMatchObject({ name: "FetchError" });

    const error = await discoverPages("https://example.com/", {
      resolve: PUBLIC_RESOLVER,
      fetchImpl: (async () => htmlResponse("nope", 404)) as typeof fetch,
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FetchError);
    expect((error as FetchError).code).toBe("http");
  });

  it("refuses an unscannable address before fetching", async () => {
    await expect(
      discoverPages("http://169.254.169.254/", { resolve: PUBLIC_RESOLVER }),
    ).rejects.toBeInstanceOf(UrlValidationError);
  });
});
