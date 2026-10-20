# Polar billing setup (Phase 3)

How ChromaBrew's AI + Pro subscription works and what it takes to run it.
Architecture first, then the steps.

## Architecture

| Piece | Where | Role |
| --- | --- | --- |
| Products | Polar catalog | Two products — **Pro Monthly $9** and **Pro Annual $90** (Polar has one billing interval per product). Both grant the same entitlements. |
| Checkout | `src/app/api/polar/checkout/route.ts` | Authenticated POST → hosted Polar checkout. Product id comes from server config, never the request. |
| Portal | `src/app/api/polar/portal/route.ts` | Fresh customer-session link per click (view subscription, receipts, cancel). |
| Webhooks | `src/app/api/webhooks/polar/route.ts` | Signature-verified (`POLAR_WEBHOOK_SECRET`); every subscription event + `customer.state_changed` flows into the local snapshot. |
| Decisions | `src/lib/polar/derive.ts` | Pure, unit-tested: which statuses grant access, until when, which keys a product maps to. Fail closed on unknown products. |
| Snapshot | `Entitlement` table | What gates read (`src/lib/entitlements-server.ts` → `hasEntitlement`, `getUserPlan`, `getBillingSummary`). Expiry is stored per grant, so a missed revocation is bounded. |
| AI gate | `src/app/api/ai/palette-suggestion/route.ts` | Free callers: 30 suggestions/min. With the `ai` entitlement: 120/min. |
| Pro gate | `src/lib/entitlements.ts` (`adapterRequiresPro`, history caps) | Export adapters beyond the core four, unlimited history/projects. |

Entitlement keys: **`pro`** and **`ai`** — both granted by either Pro
product, kept as separate keys so AI can later be metered or sold alone.

## Environment variables

| Var | Where it comes from | Needed by |
| --- | --- | --- |
| `POLAR_ACCESS_TOKEN` | Polar dashboard → Settings → Tokens (a **sandbox** token for sandbox) | checkout, portal, setup script |
| `POLAR_ENVIRONMENT` | `sandbox` or `production` (default `production`) | client base URL |
| `POLAR_PRODUCT_PRO_MONTHLY` | printed by `npm run billing:setup` | checkout allowlist, webhook mapping |
| `POLAR_PRODUCT_PRO_ANNUAL` | printed by `npm run billing:setup` | same |
| `POLAR_WEBHOOK_SECRET` | webhook endpoint settings in Polar | webhook signature verification |

Never expose these on the client — all of them are server-only (no
`NEXT_PUBLIC_` prefix), and nothing in `src/components` may import the
Polar config except through the API routes.

## Steps (sandbox first)

1. **Create a Polar account/org** and switch to the **sandbox** environment.
   Create an access token.
2. **Create the products:**
   ```bash
   POLAR_ACCESS_TOKEN=… POLAR_ENVIRONMENT=sandbox npm run billing:setup
   ```
   Idempotent (finds products by name), prints both env lines.
3. **Set the env vars** — `.env.local` for local dev, and the same names in
   Vercel (Production + Preview) for deploys.
4. **Create the webhook endpoint** in Polar → Developer → Webhooks:
   - URL: `https://www.chromabrew.com/api/webhooks/polar`
   - Events: all `subscription.*` events plus `customer.state_changed`
   - Copy the signing secret into `POLAR_WEBHOOK_SECRET`
5. **Restart dev / redeploy.**

Sandbox catalog and production catalog are **separate**: going live means a
new production access token and the *same env var names* re-pointed at
production product ids (`billing:setup` run with `POLAR_ENVIRONMENT` unset),
plus a production webhook endpoint + secret.

## Local webhook delivery

Polar must reach your machine to deliver webhooks during development. Point
a tunnel (e.g. `cloudflared tunnel --url http://localhost:3000` or ngrok) at
your dev server and register the tunnel URL as a *second*, development
webhook endpoint with the same events. Production's endpoint stays the
`www.chromabrew.com` one.

## End-to-end verification

- [ ] `npm test` — derive rules (statuses × expiry × unknown products),
      entitlement expiry, AI limit flip.
- [ ] Signed out → Upgrade → redirected to sign-in.
- [ ] Signed in → Upgrade → Polar checkout → test card `4242 4242 4242 4242`,
      future expiry, any CVC.
- [ ] Return to `/account?checkout=success` → within seconds the card flips
      to **Pro + AI**, `renews <date>`, and `/api/billing/plan` reports both
      entitlements (the webhook did the granting — not the redirect).
- [ ] Manage billing opens the Polar portal; cancel there → `/account`
      shows `cancels <date>` and Pro **stays until that date** (access
      follows paid time).
- [ ] After the period ends (or `subscription.revoked` lands): plan reads
      Free.
- [ ] Purchase the annual product in a second test run: same grants,
      `renews` one year out.

## Failure modes, by design

- **Webhook delayed/lost** → access is *postponed*, never extended: grants
  carry `expiresAt`, and `customer.state_changed` rebuilds the table from
  Polar's authoritative state.
- **Handler throws** → the adapter fails the response → Polar retries;
  every write is keyed by Polar ids, so retries converge.
- **Billing env missing** → checkout/portal answer 503 with a clear message;
  builds and tests never need the vars (client is lazy-initialized).
- **Unknown product id** → grants nothing (fail closed).
