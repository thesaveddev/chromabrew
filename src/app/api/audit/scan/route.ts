import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { ScannerOfflineError, requireScanner } from "@/lib/audit/heartbeat";
import { getScanStatusDto } from "@/lib/audit/queries";
import { checkScanQuota, clientIpFromHeaders, hashIp } from "@/lib/audit/rate-limit";
import { ScanRequestError, enqueueScan, validateScanRequest } from "@/lib/audit/runner";
import { DEFAULT_VIEWPORT_ID, type ScanScopeId } from "@/lib/audit/types";
import { UrlValidationError } from "@/lib/audit/url-validator";

export const runtime = "nodejs";

/**
 * Create a scan.
 *
 * The work itself belongs to the worker (`docs/AUDIT_WORKER_HOST.md`); this route
 * only validates, applies the quota, and writes a `queued` row. All three come
 * from the modules that already implement them, because the version that
 * reimplemented them had drifted from every one of them at once. It ignored the
 * requested viewport and always wrote 1280x720, never called the rate limiter so
 * the documented `429` could not happen, answered `201` with `{ scanId }` while
 * the documented contract and the scanner UI both expected `202` with `{ id }`
 * (leaving the UI to create a scan and then report "the audit could not be
 * started"), and handed the caller a `400` naming the failing Prisma call when a
 * database table was simply missing.
 *
 * It also refuses while no scanner is running, which is the one failure it can
 * answer without writing anything. A `queued` row with no worker is not a
 * queued audit, it is a ten-minute wait ending in a failure, and writing it
 * costs the reader that wait and occupies a scanner slot while it lasts.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a url." }, { status: 400 });
  }

  const { url, scope, viewport } = (body ?? {}) as {
    url?: unknown;
    scope?: ScanScopeId;
    viewport?: string;
  };

  if (typeof url !== "string" || url.trim() === "") {
    return NextResponse.json({ error: "Enter a website address to scan." }, { status: 400 });
  }

  const scopeId = scope ?? "single_page";
  const viewportId = viewport ?? DEFAULT_VIEWPORT_ID;

  try {
    // Before the quota, deliberately: a load limit must not decide whether a typo
    // is a typo, or a busy scanner answers an unparseable URL with "try again
    // shortly". `enqueueScan` runs the same check again when it writes.
    validateScanRequest({ url, scope: scopeId, viewportId });

    // Then whether anything is there to run it, and before the quota. With no
    // scanner the true answer is "the scanner is offline"; a quota refusal
    // reading "try again in a few moments" would send the reader straight back
    // into the same wall for as long as the worker is down, and the queue being
    // full of unattended rows is a symptom of this, not a separate condition.
    await requireScanner();

    const session = await auth();
    const userId = session?.user?.id ?? null;
    const ipHash = hashIp(clientIpFromHeaders(request.headers));

    // Then the quota, before any work: the cheapest way to refuse a flood is not
    // to write a row for it.
    const quota = await checkScanQuota({ userId, ipHash });
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.reason ?? "Too many scans just now. Try again shortly.",
          // The specific limit, not a generic refusal: the scanner being busy
          // and the caller having used up their day are different answers, and
          // the interface tells the reader which one they got.
          code: quota.code ?? "quota",
        },
        {
          status: 429,
          headers: quota.retryAfterSeconds
            ? { "Retry-After": String(quota.retryAfterSeconds) }
            : undefined,
        },
      );
    }

    const { id } = await enqueueScan({ url, scope: scopeId, viewportId, userId, ipHash });

    // The same DTO the poll endpoint returns, so the first frame the client draws
    // comes from the row rather than from a guess at which stage it is in.
    const dto = await getScanStatusDto(id);
    return NextResponse.json(dto ?? { id, status: "queued" }, { status: 202 });
  } catch (error) {
    // A rejected URL or an unsupported scope is the caller's to fix, and its
    // message is written to be shown. Anything else is ours: log it, and tell the
    // caller only that it failed.
    if (error instanceof UrlValidationError || error instanceof ScanRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // 503, not 429: the caller has done nothing wrong and waiting is not the
    // remedy — the scanner has to come back. The code is what the form branches
    // on to render the offline state instead of an error message.
    if (error instanceof ScannerOfflineError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 503 },
      );
    }
    console.error("audit scan enqueue failed", error);
    return NextResponse.json(
      { error: "The scanner is temporarily unavailable.", code: "internal" },
      { status: 503 },
    );
  }
}
