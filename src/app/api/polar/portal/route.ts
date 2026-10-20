import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getPolar } from "@/lib/polar/client";
import { billingConfigured } from "@/lib/polar/config";
import { siteUrl } from "@/lib/site-url";

/**
 * One-click link into Polar's hosted customer portal (view subscriptions,
 * receipts, cancel). The session is minted fresh per click from the
 * authenticated user's external id — no customer id ever comes from the
 * client.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!billingConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const customerSession = await getPolar().customerSessions.create({
      external_customer_id: session.user.id,
      return_url: `${siteUrl}/account`,
    });
    return NextResponse.json({ url: customerSession.customer_portal_url });
  } catch (error) {
    console.error("[polar] customer session failed", error);
    return NextResponse.json(
      { error: "No billing account yet — upgrade first." },
      { status: 404 },
    );
  }
}
