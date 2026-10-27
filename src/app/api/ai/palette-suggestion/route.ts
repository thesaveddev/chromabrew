import { NextResponse } from "next/server";
import {
  AI_SUGGESTIONS_PER_MINUTE,
  AI_SUGGESTIONS_PER_MINUTE_PRO,
  checkAiRateLimit,
} from "@/lib/ai/rate-limit";
import { suggestPalettes } from "@/lib/ai/palette-suggest";
import { auth } from "@/lib/auth/config";
import { hasEntitlement } from "@/lib/entitlements-server";

/** Descriptions are matched keyword-by-keyword; beyond this is spam, not a brief. */
const MAX_DESCRIPTION_LENGTH = 500;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * AI palette suggestion engine (heuristic keyword → hue mapping, one
 * suggestion per harmony strategy — see `@/lib/ai/palette-suggest`).
 * No LLM API required — works entirely offline.
 */
export async function POST(request: Request) {
  // Phase 3 gate: the `ai` entitlement (Pro) buys a wider bucket. Signed-out
  // and free callers keep the standard limit — the endpoint stays usable for
  // everyone, which is what the pricing page promises.
  const session = await auth();
  const entitled = session?.user?.id
    ? await hasEntitlement(session.user.id, "ai")
    : false;
  const { allowed, retryAfterSeconds } = checkAiRateLimit(
    clientKey(request),
    Date.now(),
    entitled ? AI_SUGGESTIONS_PER_MINUTE_PRO : AI_SUGGESTIONS_PER_MINUTE,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many suggestions. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  const body = await request.json();
  const { description } = body as { description: string };

  if (!description || description.trim().length === 0) {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 },
    );
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: `description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  return NextResponse.json({ suggestions: suggestPalettes(description) });
}
