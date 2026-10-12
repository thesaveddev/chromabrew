import { describe, expect, it } from "vitest";
import {
  assertAllowedUrlSyntax,
  assertSafeRedirect,
  classifyIp,
  isIpLiteral,
  UrlValidationError,
  validateScanUrl,
  type HostResolver,
} from "./url-validator";

function resolverReturning(map: Record<string, string[]>): HostResolver {
  return async (hostname) => {
    const addresses = map[hostname];
    if (!addresses) throw new Error(`ENOTFOUND ${hostname}`);
    return addresses;
  };
}

async function expectRejection(
  action: () => Promise<unknown> | unknown,
  code: string,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    expect(error).toBeInstanceOf(UrlValidationError);
    expect((error as UrlValidationError).code).toBe(code);
    return;
  }
  throw new Error(`Expected rejection with code "${code}", but nothing was thrown`);
}

/* ------------------------------------------------------------------ */
/* IP classification                                                   */
/* ------------------------------------------------------------------ */

describe("classifyIp — IPv4", () => {
  it("blocks every private, loopback and reserved range", async () => {
    const blocked = [
      "0.0.0.0",
      "10.1.2.3",
      "100.64.5.5",
      "127.0.0.1",
      "127.255.255.254",
      "169.254.169.254", // AWS/GCP/Azure metadata
      "172.16.0.1",
      "172.31.255.255",
      "192.0.0.8",
      "192.0.2.10",
      "192.88.99.1",
      "192.168.1.1",
      "198.18.0.1",
      "198.51.100.4",
      "203.0.113.9",
      "224.0.0.1",
      "239.255.255.250",
      "240.0.0.1",
      "255.255.255.255",
    ];
    for (const address of blocked) {
      expect(classifyIp(address)?.blocked, `${address} should be blocked`).toBe(true);
    }
  });

  it("allows ordinary public addresses", async () => {
    for (const address of ["1.1.1.1", "8.8.8.8", "93.184.216.34", "172.32.0.1", "172.15.0.1"]) {
      expect(classifyIp(address)?.blocked, `${address} should be allowed`).toBe(false);
    }
  });

  it("names the 172.16/12 boundary precisely", async () => {
    expect(classifyIp("172.15.255.255")?.blocked).toBe(false);
    expect(classifyIp("172.16.0.0")?.blocked).toBe(true);
    expect(classifyIp("172.31.255.255")?.blocked).toBe(true);
    expect(classifyIp("172.32.0.0")?.blocked).toBe(false);
  });

  it("returns null for things that are not IP literals", async () => {
    expect(classifyIp("example.com")).toBeNull();
    expect(classifyIp("1.2.3")).toBeNull();
    expect(classifyIp("1.2.3.4.5")).toBeNull();
    expect(classifyIp("256.1.1.1")).toBeNull();
    expect(classifyIp("")).toBeNull();
  });
});

describe("classifyIp — IPv6", () => {
  it("blocks loopback, ULA, link-local, multicast and tunnelling prefixes", async () => {
    const blocked = [
      "::",
      "::1",
      "fc00::1",
      "fd12:3456:789a::1",
      "fe80::1",
      "ff02::1",
      "2001:db8::1",
      "2002::1",
      "64:ff9b::1.2.3.4",
      "2001::1",
      "100::1",
    ];
    for (const address of blocked) {
      expect(classifyIp(address)?.blocked, `${address} should be blocked`).toBe(true);
    }
  });

  it("allows global unicast addresses", async () => {
    for (const address of ["2606:4700:4700::1111", "2a00:1450:4009:81f::200e"]) {
      expect(classifyIp(address)?.blocked, `${address} should be allowed`).toBe(false);
    }
  });

  it("unwraps IPv4-mapped addresses and judges the inner address", async () => {
    expect(classifyIp("::ffff:127.0.0.1")?.blocked).toBe(true);
    expect(classifyIp("::ffff:169.254.169.254")?.blocked).toBe(true);
    expect(classifyIp("::ffff:8.8.8.8")?.blocked).toBe(false);
  });

  it("handles bracketed and zone-scoped literals", async () => {
    expect(classifyIp("[::1]")?.blocked).toBe(true);
    expect(classifyIp("fe80::1%eth0")?.blocked).toBe(true);
    expect(classifyIp("[2606:4700::1111]")?.blocked).toBe(false);
  });

  it("identifies IP literals for hostnames", async () => {
    expect(isIpLiteral("127.0.0.1")).toBe(true);
    expect(isIpLiteral("[::1]")).toBe(true);
    expect(isIpLiteral("chromabrew.com")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* URL syntax                                                          */
/* ------------------------------------------------------------------ */

describe("assertAllowedUrlSyntax", () => {
  it("accepts and normalises ordinary URLs", async () => {
    expect(assertAllowedUrlSyntax("chromabrew.app").toString()).toBe("https://chromabrew.app/");
    expect(assertAllowedUrlSyntax("HTTPS://Example.COM/Pricing?x=1").toString()).toBe(
      "https://example.com/Pricing?x=1",
    );
    expect(assertAllowedUrlSyntax("http://example.com:80/").toString()).toBe("http://example.com/");
  });

  it("strips the fragment so two spellings of a page are one scan", async () => {
    expect(assertAllowedUrlSyntax("https://example.com/docs#install").toString()).toBe(
      "https://example.com/docs",
    );
  });

  it("rejects non-http protocols", async () => {
    for (const raw of [
      "ftp://example.com",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "data:text/html,hi",
      "gopher://example.com",
    ]) {
      await expectRejection(() => assertAllowedUrlSyntax(raw), "protocol");
    }
  });

  it("rejects embedded credentials", async () => {
    await expectRejection(
      () => assertAllowedUrlSyntax("https://user:secret@example.com"),
      "credentials",
    );
  });

  it("rejects non-standard ports", async () => {
    for (const raw of [
      "http://example.com:8080",
      "https://example.com:3000",
      "http://example.com:22",
      "http://localhost:6379",
    ]) {
      await expectRejection(() => assertAllowedUrlSyntax(raw), "port");
    }
  });

  it("rejects localhost and internal hostnames", async () => {
    for (const raw of [
      "http://localhost/",
      "http://localhost.localdomain/",
      "http://app.localhost/",
      "http://printer.local/",
      "http://vault.internal/",
      "http://router.lan/",
      "http://metadata.google.internal/",
      "http://somewhere.onion/",
      "http://intranet/",
    ]) {
      await expectRejection(() => assertAllowedUrlSyntax(raw), "host_blocked");
    }
  });

  it("rejects private and metadata IP literals without needing DNS", async () => {
    for (const raw of [
      "http://127.0.0.1/",
      "http://[::1]/",
      "http://169.254.169.254/latest/meta-data/",
      "http://10.0.0.5/",
      "http://192.168.0.1/",
      "http://[fd00::1]/",
      "http://0.0.0.0/",
    ]) {
      await expectRejection(() => assertAllowedUrlSyntax(raw), "ip_blocked");
    }
  });

  it("accepts a public IP literal", async () => {
    expect(assertAllowedUrlSyntax("http://93.184.216.34/").hostname).toBe("93.184.216.34");
  });

  it("rejects empty, oversized and malformed input", async () => {
    await expectRejection(() => assertAllowedUrlSyntax("   "), "invalid");
    await expectRejection(
      () => assertAllowedUrlSyntax(`https://example.com/${"a".repeat(2100)}`),
      "too_long",
    );
  });
});

/* ------------------------------------------------------------------ */
/* DNS                                                                 */
/* ------------------------------------------------------------------ */

describe("validateScanUrl", () => {
  it("accepts a hostname that only resolves to public addresses", async () => {
    const result = await validateScanUrl(
      "example.com",
      resolverReturning({ "example.com": ["93.184.216.34", "2606:4700::1111"] }),
    );
    expect(result.normalized).toBe("https://example.com/");
    expect(result.addresses).toEqual(["93.184.216.34", "2606:4700::1111"]);
  });

  it("rejects a hostname that resolves to a private address", async () => {
    await expectRejection(
      () => validateScanUrl("evil.example.org", resolverReturning({ "evil.example.org": ["10.0.0.9"] })),
      "dns_private",
    );
  });

  it("rejects when only one of several answers is private (split-horizon DNS)", async () => {
    await expectRejection(
      () =>
        validateScanUrl(
          "mixed.example.org",
          resolverReturning({ "mixed.example.org": ["93.184.216.34", "127.0.0.1"] }),
        ),
      "dns_private",
    );
  });

  it("rejects wildcard-DNS hosts that point at loopback", async () => {
    await expectRejection(
      () =>
        validateScanUrl("127.0.0.1.nip.io", resolverReturning({ "127.0.0.1.nip.io": ["127.0.0.1"] })),
      "dns_private",
    );
  });

  it("rejects hostnames that do not resolve", async () => {
    await expectRejection(() => validateScanUrl("nope.example.org", resolverReturning({})), "dns_failed");
  });

  it("reports an empty answer set as a resolution failure", async () => {
    await expectRejection(
      () => validateScanUrl("blank.example.org", resolverReturning({ "blank.example.org": [] })),
      "dns_failed",
    );
  });

  it("does not resolve a literal address through DNS", async () => {
    const calls: string[] = [];
    const spy: HostResolver = async (hostname) => {
      calls.push(hostname);
      return ["93.184.216.34"];
    };
    await validateScanUrl("http://93.184.216.34/", spy);
    expect(calls).toEqual([]);
  });
});

describe("assertSafeRedirect", () => {
  const from = new URL("https://example.com/");

  it("resolves relative redirects", async () => {
    const next = await assertSafeRedirect(
      from,
      "/login",
      resolverReturning({ "example.com": ["93.184.216.34"] }),
    );
    expect(next.toString()).toBe("https://example.com/login");
  });

  it("blocks a redirect into the private network", async () => {
    await expectRejection(
      () => assertSafeRedirect(from, "http://169.254.169.254/", resolverReturning({})),
      "ip_blocked",
    );
    await expectRejection(
      () => assertSafeRedirect(from, "http://internal.corp/", resolverReturning({})),
      "host_blocked",
    );
    await expectRejection(
      () =>
        assertSafeRedirect(
          from,
          "https://rebind.example.org/",
          resolverReturning({ "rebind.example.org": ["192.168.1.10"] }),
        ),
      "dns_private",
    );
  });

  it("blocks a redirect off http(s)", async () => {
    await expectRejection(
      () => assertSafeRedirect(from, "ftp://example.com/x", resolverReturning({})),
      "protocol",
    );
  });
});
