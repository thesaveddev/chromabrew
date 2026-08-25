import Stripe from "stripe";
import type { Stripe as StripeTypes } from "stripe";

let _stripe: StripeTypes | null = null;

/** Server-side Stripe instance — lazy-initialised so build doesn't fail without env vars. */
export function getStripe(): StripeTypes {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

/** Price IDs for each plan — set these in your Stripe Dashboard. */
export const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_monthly",
} as const;

/** Webhook signing secret — from Stripe Dashboard > Developers > Webhooks. */
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
