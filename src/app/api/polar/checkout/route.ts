import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { getPolar } from "@/lib/polar/client";
import {
  billingConfigured,
  productIdForInterval,
  type BillingInterval,
} from "@/lib/polar/config";
import { siteUrl } from "@/lib/site-url";

/**
 * Start a Polar checkout for Pro. The product id comes from server config —
 * never from the request — and the customer identity is the authenticated
 * user id, so a purchase can never be attached to someone else's account.
 * Provisioning happens in /api/webhooks/polar, not on the success redirect:
 * a redirect proves nothing, a signed webhook does.
 */
export async function POST(request: Request) {
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

  let interval: BillingInterval = "month";
  try {
    const body = (await request.json()) as { interval?: string } | null;
    const requested = body?.interval;
    if (requested === "year") interval = "year";
    else if (requested !== undefined && requested !== "month") {
      return NextResponse.json({ error: "Unknown interval." }, { status: 400 });
    }
  } catch {
    /* no/invalid body → monthly */
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true },
  });

  try {
    const checkout = await getPolar().checkouts.create({
      products: [productIdForInterval(interval)],
      external_customer_id: session.user.id,
      customer_email: user.email ?? undefined,
      success_url: `${siteUrl}/account?checkout=success`,
      // Polar's `return_url` is where the hosted checkout's back/cancel
      // navigation lands (there is no separate cancel_url).
      return_url: `${siteUrl}/pricing`,
      metadata: { userId: session.user.id },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("[polar] checkout create failed", error);
    return NextResponse.json(
      { error: "Checkout is not available right now. Try again later." },
      { status: 502 },
    );
  }
}
