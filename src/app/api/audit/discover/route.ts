import { NextResponse } from "next/server";
import { discoverPages } from "@/lib/audit/discover";
import { clientIpFromHeaders, hashIp } from "@/lib/audit/rate-limit";
import { UrlValidationError } from "@/lib/audit/url-validator";
import { FetchError } from "@/lib/audit/analyzer";

export const runtime = "nodejs";

/**
 * List the pages a crawl would visit from one URL, for the selected-pages
 * picker. Fetch-only (no browser on this tier), same-origin, capped — the
 * same `planNextPages` policy the worker crawls with, so the checklist can
 * never offer a page a scan would refuse. Picked URLs are re-validated at
 * scan time either way; this endpoint only fills the form.
 */

// Per-isolate lookup throttle: friction against fetch farming, not a quota.
// The SSRF gates hold regardless of who asks; this just stops one reader
// turning the endpoint into a free fetch proxy at full speed.
const LOOKUPS_PER_MINUTE = 30;
const lookups = new Map<string, number[]>();

function lookupAllowed(identity: string): boolean {
  const now = Date.now();
  const recent = (lookups.get(identity) ?? []).filter((at) => now - at < 60_000);
  if (recent.length >= LOOKUPS_PER_MINUTE) {
    lookups.set(identity, recent);
    return false;
  }
  recent.push(now);
  lookups.set(identity, recent);
  return true;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a url." }, { status: 400 });
  }

  const { url } = (body ?? {}) as { url?: unknown };
  if (typeof url !== "string" || url.trim() === "") {
    return NextResponse.json({ error: "Enter a website address first." }, { status: 400 });
  }

  const identity = hashIp(clientIpFromHeaders(request.headers)) ?? "anonymous";
  if (!lookupAllowed(identity)) {
    return NextResponse.json(
      { error: "Too many page lookups just now. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const result = await discoverPages(url);
    return NextResponse.json(result);
  } catch (error) {
    // Rejected addresses and unreadable pages are the caller's to fix, with
    // messages written to be shown next to the picker. Anything else is ours.
    if (error instanceof UrlValidationError || error instanceof FetchError) {
      const status = error instanceof FetchError ? 502 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("audit page discovery failed", error);
    return NextResponse.json(
      { error: "The page list could not be read. Type page URLs manually instead." },
      { status: 503 },
    );
  }
}
