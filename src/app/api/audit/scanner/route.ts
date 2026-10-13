import { NextResponse } from "next/server";

import { readScannerAvailability } from "@/lib/audit/heartbeat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Whether there is a scanner to run an audit.
 *
 * Read by the audit form before it accepts a URL. The audit page itself stays
 * prerendered: this is fetched by the form, so availability costs a database
 * read only for readers who are actually looking at the form, and a page served
 * from the build cache can never carry a stale "online".
 *
 * It is not what enforces anything — `POST /api/audit/scan` asks the same
 * question again and refuses there (`requireScanner`). This endpoint is what
 * lets the interface say so before a URL is typed, rather than after it is
 * submitted; the refusal is the guarantee, this is the courtesy.
 *
 * The answer is deliberately the whole `ScannerAvailability` object rather than
 * a bare boolean, because the two ways of being unavailable read differently:
 * a scanner that has never checked in is a deployment that has not been started,
 * and one last seen four minutes ago is a scanner that stopped. The form says
 * which.
 *
 * Never cached. All three fields are timestamps, and a cached one is exactly the
 * stale answer this endpoint exists to prevent.
 */
export async function GET() {
  try {
    const availability = await readScannerAvailability();
    return NextResponse.json(availability, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    // A database that cannot answer is not a scanner that is down, and the form
    // treats the two differently: an unreadable answer leaves the form usable
    // and lets the submit decide, while a real "offline" disables it and shows
    // the reader a state. Answering "offline" here would take the audit feature
    // down behind a message naming the wrong cause.
    console.error("audit scanner availability failed", error);
    return NextResponse.json(
      { error: "Could not check the scanner right now.", code: "internal" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
