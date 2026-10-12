/**
 * URL validation and SSRF containment.
 *
 * Every URL the scanner touches is untrusted input from a stranger, so this
 * module is the boundary that decides what the rest of the pipeline is allowed
 * to reach. It has three gates, and they are deliberately ordered so that a
 * refusal always happens as early as it possibly can:
 *
 *   1. `assertAllowedUrlSyntax` — pure string work. Scheme, credentials, port,
 *      internal hostnames and *literal* private addresses (including the
 *      169.254.169.254 cloud-metadata endpoint) are refused without any network
 *      access at all, so a hostile URL cannot make the worker do DNS work.
 *   2. `resolveAndAssertPublic` — DNS. A hostname is resolved through an
 *      injected `HostResolver` and **every** answer must be public. One private
 *      answer in a split-horizon or wildcard-DNS reply is a failure, not a
 *      lucky draw, which is what closes the rebinding window between the check
 *      and the request.
 *   3. `assertSafeRedirect` — the same two gates applied again to every redirect
 *      hop. Re-validating only the URL the user typed would let a public host
 *      bounce the scanner into the private network, so each `Location` is
 *      resolved and re-checked before it is followed.
 *
 * The resolver is a parameter rather than a module-level call on purpose: the
 * security properties above are only worth claiming if they can be tested, and
 * an injected resolver lets the suite prove every refusal path offline and
 * deterministically. Production uses `systemResolver` by default.
 *
 * Nothing here claims a URL is *safe* — only that it is not one of the things
 * this scanner refuses to reach.
 */

import { isIP } from "node:net";

/** The longest URL the form will accept, matching the DB column's intent. */
const MAX_URL_LENGTH = 2000;

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** `URL` normalises a default port to the empty string, so both spellings pass. */
const ALLOWED_PORTS = new Set(["", "80", "443"]);

/**
 * Hostnames refused by name. Suffix rules cover the reserved TLDs that can
 * never be a customer's website; the exact matches cover the names that are
 * routinely pointed at internal services.
 */
const BLOCKED_HOSTNAMES = new Set(["localhost", "intranet", "metadata", "instance-data"]);

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".localdomain",
  ".internal",
  ".lan",
  ".home",
  ".corp",
  ".onion",
];

/** A scheme, as opposed to a bare hostname somebody pasted without one. */
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

/** Tracking parameters stripped so two spellings of a page are one scan. */
const TRACKING_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
];

export type UrlValidationErrorCode =
  | "invalid"
  | "too_long"
  | "protocol"
  | "credentials"
  | "port"
  | "host_blocked"
  | "ip_blocked"
  | "dns_failed"
  | "dns_private";

export class UrlValidationError extends Error {
  readonly code: UrlValidationErrorCode;

  constructor(message: string, code: UrlValidationErrorCode) {
    super(message);
    this.name = "UrlValidationError";
    this.code = code;
  }
}

/** How a hostname or address was judged, kept for evidence in the record. */
export type IpCategory =
  | "public"
  | "private"
  | "loopback"
  | "link-local"
  | "multicast"
  | "unspecified"
  | "shared"
  | "documentation"
  | "benchmark"
  | "reserved";

export interface IpClassification {
  blocked: boolean;
  category: IpCategory;
}

export interface HostResolver {
  (hostname: string): Promise<string[]>;
}

export interface ValidatedUrl {
  /** The parsed URL: default port and fragment removed, host lower-cased. */
  url: URL;
  /** `url` as the canonical string the database stores. */
  normalized: string;
  /** Lower-cased hostname, brackets and zone stripped. */
  hostname: string;
  /** Every address the host resolved to. A literal address resolves to itself. */
  addresses: string[];
}

/**
 * The real resolver. Imported lazily so this module stays free of a top-level
 * DNS dependency, and re-thrown as `dns_failed` by the caller rather than
 * leaking a Node error into a user-facing message.
 */
export const systemResolver: HostResolver = async (hostname: string): Promise<string[]> => {
  const { lookup } = await import("node:dns/promises");
  const records = await lookup(hostname, { all: true });
  return records.map((record) => record.address);
};

/* ------------------------------------------------------------------ */
/* Address classification                                              */
/* ------------------------------------------------------------------ */

const ipv4ToInt = (a: number, b: number, c: number, d: number): number =>
  ((a << 24) >>> 0) + (b << 16) + (c << 8) + d;

/**
 * Refused IPv4 space, as inclusive integer ranges so the 172.16/12 boundary is
 * expressed exactly rather than by a loose prefix match.
 */
const BLOCKED_IPV4_RANGES: ReadonlyArray<readonly [number, number, IpCategory]> = [
  [ipv4ToInt(0, 0, 0, 0), ipv4ToInt(0, 255, 255, 255), "unspecified"],
  [ipv4ToInt(10, 0, 0, 0), ipv4ToInt(10, 255, 255, 255), "private"],
  [ipv4ToInt(100, 64, 0, 0), ipv4ToInt(100, 127, 255, 255), "shared"], // CGNAT
  [ipv4ToInt(127, 0, 0, 0), ipv4ToInt(127, 255, 255, 255), "loopback"],
  [ipv4ToInt(169, 254, 0, 0), ipv4ToInt(169, 254, 255, 255), "link-local"],
  [ipv4ToInt(172, 16, 0, 0), ipv4ToInt(172, 31, 255, 255), "private"],
  [ipv4ToInt(192, 0, 0, 0), ipv4ToInt(192, 0, 0, 255), "reserved"],
  [ipv4ToInt(192, 0, 2, 0), ipv4ToInt(192, 0, 2, 255), "documentation"],
  [ipv4ToInt(192, 88, 99, 0), ipv4ToInt(192, 88, 99, 255), "reserved"],
  [ipv4ToInt(192, 168, 0, 0), ipv4ToInt(192, 168, 255, 255), "private"],
  [ipv4ToInt(198, 18, 0, 0), ipv4ToInt(198, 19, 255, 255), "benchmark"],
  [ipv4ToInt(198, 51, 100, 0), ipv4ToInt(198, 51, 100, 255), "documentation"],
  [ipv4ToInt(203, 0, 113, 0), ipv4ToInt(203, 0, 113, 255), "documentation"],
  [ipv4ToInt(224, 0, 0, 0), ipv4ToInt(239, 255, 255, 255), "multicast"],
  [ipv4ToInt(240, 0, 0, 0), ipv4ToInt(255, 255, 255, 255), "reserved"],
];

function classifyIpv4(address: string): IpClassification | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;

  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  const value = ipv4ToInt(octets[0], octets[1], octets[2], octets[3]);
  for (const [start, end, category] of BLOCKED_IPV4_RANGES) {
    if (value >= start && value <= end) return { blocked: true, category };
  }
  return { blocked: false, category: "public" };
}

/**
 * Expands an IPv6 literal to its eight groups, or `null` if it is not one.
 * Handles `::` compression, a bracketed host, a `%zone` suffix and an embedded
 * dotted-quad IPv4 tail.
 */
function expandIpv6(input: string): number[] | null {
  let address = input.trim().toLowerCase();
  const zone = address.indexOf("%");
  if (zone !== -1) address = address.slice(0, zone);

  // An embedded IPv4 tail is two groups once expanded.
  const lastColon = address.lastIndexOf(":");
  const ipv4Tail = address.slice(lastColon + 1);
  if (ipv4Tail.includes(".")) {
    const v4 = classifyIpv4(ipv4Tail);
    if (v4 === null) return null;
    const octets = ipv4Tail.split(".").map(Number);
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    address = `${address.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const parts = address.split("::");
  if (parts.length > 2) return null;

  const compressed = parts.length === 2;
  const head = parts[0];
  const tail = compressed ? parts[1] : "";

  const headGroups = head.length > 0 ? head.split(":") : [];
  const tailGroups = tail.length > 0 ? tail.split(":") : [];

  if (!compressed) {
    // No compression: exactly eight groups required.
    if (headGroups.length !== 8) return null;
  } else if (headGroups.length + tailGroups.length === 8) {
    // `::` must stand for at least one group, so eight written in full is not
    // a compressed address at all.
    return null;
  } else if (headGroups.length + tailGroups.length > 8) {
    return null;
  }

  const fill = 8 - headGroups.length - tailGroups.length;
  const groups = [...headGroups, ...Array<string>(fill).fill("0"), ...tailGroups];
  if (groups.length !== 8) return null;

  const parsed = groups.map((group) => {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return NaN;
    return parseInt(group, 16);
  });
  return parsed.some((value) => Number.isNaN(value)) ? null : parsed;
}

const ipGroup = (groups: number[], index: number): number => groups[index] ?? 0;
const allZero = (groups: number[], from: number, to: number): boolean =>
  groups.slice(from, to).every((group) => group === 0);

function classifyIpv6(address: string): IpClassification | null {
  const groups = expandIpv6(address);
  if (groups === null) return null;

  // `::`, `::1` and every IPv4-mapped or IPv4-compatible form (`::ffff:127.0.0.1`,
  // `::ffff:8.8.8.8`) are judged as the address they actually name, so a mapped
  // loopback cannot slip past as "some IPv6".
  if (allZero(groups, 0, 5) && (ipGroup(groups, 5) === 0 || ipGroup(groups, 5) === 0xffff)) {
    const g6 = ipGroup(groups, 6);
    const g7 = ipGroup(groups, 7);
    const octets = [g6 >> 8, g6 & 0xff, g7 >> 8, g7 & 0xff];
    return classifyIpv4(octets.join("."));
  }

  const first = ipGroup(groups, 0);
  const second = ipGroup(groups, 1);
  const blocked = (category: IpCategory): IpClassification => ({ blocked: true, category });

  if ((first & 0xfe00) === 0xfc00) return blocked("private"); // fc00::/7 ULA
  if ((first & 0xffc0) === 0xfe80) return blocked("link-local"); // fe80::/10
  if ((first & 0xff00) === 0xff00) return blocked("multicast"); // ff00::/8
  if (first === 0x2001 && second === 0x0db8) return blocked("documentation"); // 2001:db8::/32
  if (first === 0x2002) return blocked("reserved"); // 2002::/16 6to4
  if (first === 0x0064 && second === 0xff9b) return blocked("reserved"); // 64:ff9b::/96 NAT64
  if (first === 0x2001 && second === 0x0000) return blocked("reserved"); // 2001::/32 Teredo
  if (first === 0x0100 && allZero(groups, 1, 4)) return blocked("reserved"); // 100::/64 discard

  return { blocked: false, category: "public" };
}

/** Removes the brackets and zone a URL host can carry, and lower-cases it. */
function unwrapHostname(hostname: string): string {
  let host = hostname.trim().toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  const zone = host.indexOf("%");
  if (zone !== -1) host = host.slice(0, zone);
  return host;
}

export function isIpLiteral(hostname: string): boolean {
  const host = unwrapHostname(hostname);
  const version = isIP(host);
  return version === 4 || version === 6;
}

/**
 * Classifies a literal address, or returns `null` for anything that is not one
 * — a hostname still has to be resolved before it can be judged.
 */
export function classifyIp(hostname: string): IpClassification | null {
  const host = unwrapHostname(hostname);
  const version = isIP(host);
  if (version === 4) return classifyIpv4(host);
  if (version === 6) return classifyIpv6(host);
  return null;
}

/* ------------------------------------------------------------------ */
/* Gate 1 — syntax, with no network access                             */
/* ------------------------------------------------------------------ */

export function assertAllowedUrlSyntax(input: string): URL {
  const raw = input.trim();
  if (raw.length === 0) {
    throw new UrlValidationError("Enter a website address to scan.", "invalid");
  }
  if (raw.length > MAX_URL_LENGTH) {
    throw new UrlValidationError("That URL is too long to scan.", "too_long");
  }

  // A bare hostname is what people actually paste, so give it a scheme rather
  // than refusing it — but anything that *does* name a scheme must be http(s).
  const candidate = SCHEME_PATTERN.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new UrlValidationError("That does not look like a website address.", "invalid");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UrlValidationError("Only http and https URLs can be scanned.", "protocol");
  }
  if (url.username.length > 0 || url.password.length > 0) {
    throw new UrlValidationError("Remove the credentials from the URL and try again.", "credentials");
  }
  // Checked before the hostname: `localhost:6379` is a port problem, and saying
  // so is more useful than calling it a blocked host.
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new UrlValidationError("Only the standard http and https ports can be scanned.", "port");
  }

  // A fragment never changes what the server returns, so dropping it keeps two
  // spellings of one page from becoming two scans.
  url.hash = "";

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_HOST_SUFFIXES.some((s) => hostname.endsWith(s))) {
    throw new UrlValidationError("Private and internal hostnames cannot be scanned.", "host_blocked");
  }

  // A single-label name resolves through the host's own search domains (or WINS),
  // so `http://vault/` can mean something inside the network that it does not
  // mean to anyone else. A public name always has a dot; an address literal is
  // judged below instead.
  if (!hostname.includes(".") && !isIpLiteral(hostname)) {
    throw new UrlValidationError("Private and internal hostnames cannot be scanned.", "host_blocked");
  }

  const literal = classifyIp(hostname);
  if (literal !== null && literal.blocked) {
    throw new UrlValidationError("Private and internal addresses cannot be scanned.", "ip_blocked");
  }

  return url;
}

/* ------------------------------------------------------------------ */
/* Gate 2 — DNS                                                        */
/* ------------------------------------------------------------------ */

/**
 * Resolves a URL's host and refuses it unless every answer is public. A literal
 * address resolves to itself without touching DNS, so a numeric host can never
 * be used to reach the network early.
 */
export async function resolveAndAssertPublic(
  url: URL,
  resolver: HostResolver = systemResolver,
): Promise<string[]> {
  const hostname = unwrapHostname(url.hostname);

  const literal = classifyIp(hostname);
  if (literal !== null) {
    if (literal.blocked) {
      throw new UrlValidationError("Private and internal addresses cannot be scanned.", "ip_blocked");
    }
    return [hostname];
  }

  let addresses: string[];
  try {
    addresses = await resolver(hostname);
  } catch {
    throw new UrlValidationError("That host could not be resolved.", "dns_failed");
  }

  if (addresses.length === 0) {
    throw new UrlValidationError("That host could not be resolved.", "dns_failed");
  }

  // Every answer is judged: one private address in a split-horizon or
  // wildcard-DNS reply is enough to refuse the host.
  for (const address of addresses) {
    const verdict = classifyIp(address);
    if (verdict === null) {
      throw new UrlValidationError("That host resolved to an unreadable address.", "dns_failed");
    }
    if (verdict.blocked) {
      throw new UrlValidationError("That host resolves to a private address.", "dns_private");
    }
  }

  return addresses;
}

/**
 * The full check for a scan target: syntax, then DNS.
 */
export async function validateScanUrl(
  input: string,
  resolver: HostResolver = systemResolver,
): Promise<ValidatedUrl> {
  const url = assertAllowedUrlSyntax(input);
  const hostname = unwrapHostname(url.hostname);
  const addresses = await resolveAndAssertPublic(url, resolver);
  return { url, normalized: url.toString(), hostname, addresses };
}

/* ------------------------------------------------------------------ */
/* Gate 3 — redirects                                                  */
/* ------------------------------------------------------------------ */

/**
 * Resolves one redirect hop against the URL that issued it and runs it back
 * through both gates. Re-validating only the typed URL would let a public host
 * bounce the scanner into the private network.
 */
export async function assertSafeRedirect(
  from: URL,
  to: string,
  resolver: HostResolver = systemResolver,
): Promise<URL> {
  let next: URL;
  try {
    next = new URL(to, from);
  } catch {
    throw new UrlValidationError("The site sent a redirect this scanner cannot read.", "invalid");
  }

  const validated = assertAllowedUrlSyntax(next.href);
  await resolveAndAssertPublic(validated, resolver);
  return validated;
}

/* ------------------------------------------------------------------ */
/* Canonical form                                                      */
/* ------------------------------------------------------------------ */

/**
 * The stored form of a scan target: syntax-checked (so junk throws here rather
 * than at the worker), fragment and tracking parameters removed.
 */
export function normalizeUrl(input: string): string {
  const url = assertAllowedUrlSyntax(input);
  url.hash = "";
  for (const parameter of TRACKING_PARAMETERS) {
    url.searchParams.delete(parameter);
  }
  return url.toString();
}
