import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { ShareError, disableScanShare, enableScanShare, getScanShare } from "@/lib/audit/share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The share state of one scan, and the only way to change it.
 *
 * `GET` reports whether a link exists, `POST` creates one and `DELETE` revokes
 * it. All three are owner-only: the session's user is compared with the scan's
 * `userId` inside the share module, not here, so there is one place where
 * ownership is decided. The response body contains a share token, so it is
 * never cached and never shared between users.
 */

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function failure(error: unknown) {
  if (error instanceof ShareError) {
    const status = error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 409;
    return noStore({ error: error.message, code: error.code }, status);
  }
  console.error("audit share failed", error);
  return noStore({ error: "Sharing is temporarily unavailable.", code: "internal" }, 503);
}

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

type Context = { params: Promise<{ scanId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) {
    return noStore({ error: "Sign in to share this report.", code: "unauthenticated" }, 401);
  }
  const { scanId } = await params;
  try {
    return noStore(await getScanShare(scanId, userId));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) {
    return noStore({ error: "Sign in to share this report.", code: "unauthenticated" }, 401);
  }
  const { scanId } = await params;
  try {
    // Sharing is a write on someone's data, so a cross-site page must not be
    // able to trigger it. Auth.js sessions are same-site cookies, so a
    // cross-site form post does not carry them; this check makes that explicit
    // rather than incidental.
    if (!isSameOriginRequest(request)) {
      return noStore({ error: "Cross-origin sharing requests are refused.", code: "cross_origin" }, 403);
    }
    return noStore(await enableScanShare(scanId, userId));
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const userId = await currentUserId();
  if (!userId) {
    return noStore({ error: "Sign in to share this report.", code: "unauthenticated" }, 401);
  }
  const { scanId } = await params;
  try {
    if (!isSameOriginRequest(request)) {
      return noStore({ error: "Cross-origin sharing requests are refused.", code: "cross_origin" }, 403);
    }
    return noStore(await disableScanShare(scanId, userId));
  } catch (error) {
    return failure(error);
  }
}

/** A request whose Origin header is present must match the host it arrived at. */
function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
