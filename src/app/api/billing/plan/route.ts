import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getBillingSummary } from "@/lib/entitlements-server";

/**
 * The one place the client learns its billing state: signed-out visitors
 * are free, signed-in users get plan + active entitlements + the Polar
 * subscription summary (renewal/cancellation display). All dollar-value
 * gating stays server-side; the client only adapts its chrome.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({
      plan: "free" as const,
      entitlements: [],
      subscription: null,
    });
  }
  return NextResponse.json(await getBillingSummary(session.user.id));
}
