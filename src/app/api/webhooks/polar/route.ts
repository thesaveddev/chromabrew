import { Webhooks } from "@polar-sh/nextjs";
import {
  applySubscription,
  reconcileCustomerState,
} from "@/lib/polar/sync";
import type {
  CustomerStateLike,
  PolarSubscriptionLike,
} from "@/lib/polar/derive";

type SubscriptionPayload = { data: PolarSubscriptionLike };
type CustomerStatePayload = { data: CustomerStateLike };

async function onSubscriptionEvent(payload: SubscriptionPayload): Promise<void> {
  await applySubscription(payload.data);
}

/**
 * Polar → us. The adapter verifies the signature (POLAR_WEBHOOK_SECRET)
 * before any handler runs; a thrown error fails the response so Polar
 * retries — which is why sync is idempotent.
 *
 * Every subscription lifecycle event funnels into the same pure decision
 * (src/lib/polar/derive.ts): created may arrive before payment settles
 * (status `incomplete` → no access), canceled may arrive while paid time
 * remains (access until `ends_at`), revoked means the clock has run out.
 * `customer.state_changed` rebuilds the snapshot from Polar's authoritative
 * view, so lost deliveries self-heal on the next state event.
 */
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "",
  onSubscriptionCreated: onSubscriptionEvent,
  onSubscriptionActive: onSubscriptionEvent,
  onSubscriptionUpdated: onSubscriptionEvent,
  onSubscriptionCanceled: onSubscriptionEvent,
  onSubscriptionCycled: onSubscriptionEvent,
  onSubscriptionPastDue: onSubscriptionEvent,
  onSubscriptionRevoked: onSubscriptionEvent,
  onSubscriptionPaused: onSubscriptionEvent,
  onSubscriptionResumed: onSubscriptionEvent,
  onSubscriptionUncanceled: onSubscriptionEvent,
  onCustomerStateChanged: async (payload: CustomerStatePayload): Promise<void> => {
    await reconcileCustomerState(payload.data);
  },
});
