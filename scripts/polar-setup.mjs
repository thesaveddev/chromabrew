#!/usr/bin/env node
/**
 * Create (or find) the ChromaBrew Pro products in Polar and print the env
 * lines the app needs. Idempotent — re-running matches existing products by
 * name and interval, so it never duplicates a catalog.
 *
 *   POLAR_ACCESS_TOKEN=… [POLAR_ENVIRONMENT=sandbox] npm run billing:setup
 *
 * Full walkthrough: docs/BILLING_SETUP.md
 */
import { config as loadEnv } from "dotenv";
import { createPolar } from "@polar-sh/sdk/2026-10";

// Local runs keep secrets in .env.local (Next's own convention); an already
// exported variable is never overridden.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const token = process.env.POLAR_ACCESS_TOKEN;
if (!token) {
  console.error(
    "POLAR_ACCESS_TOKEN is not set.\n" +
      "Create one in the Polar dashboard (sandbox first) — see docs/BILLING_SETUP.md",
  );
  process.exit(1);
}

const environment =
  process.env.POLAR_ENVIRONMENT === "sandbox" ? "sandbox" : "production";
const polar = createPolar({ accessToken: token, environment });

// Prices in USD cents. Monthly $9, annual $90 (2 months free).
const PRODUCTS = [
  {
    name: "ChromaBrew Pro Monthly",
    interval: "month",
    priceAmount: 900,
    envVar: "POLAR_PRODUCT_PRO_MONTHLY",
  },
  {
    name: "ChromaBrew Pro Annual",
    interval: "year",
    priceAmount: 9000,
    envVar: "POLAR_PRODUCT_PRO_ANNUAL",
  },
];

console.log(`Polar environment: ${environment}`);

const listed = await polar.products.list({
  limit: 100,
  is_recurring: true,
  page: 1,
});

const lines = [];
for (const plan of PRODUCTS) {
  const existing = (listed.items ?? []).find(
    (p) => p.name === plan.name && p.recurring_interval === plan.interval,
  );

  let product = existing;
  if (product) {
    console.log(`found   ${plan.name} → ${product.id}`);
  } else {
    product = await polar.products.create({
      name: plan.name,
      recurring_interval: plan.interval,
      prices: [
        {
          amount_type: "fixed",
          price_amount: plan.priceAmount,
          price_currency: "usd",
        },
      ],
    });
    console.log(`created ${plan.name} → ${product.id}`);
  }
  lines.push(`${plan.envVar}=${product.id}`);
}

console.log("\nAdd these to .env.local (and to Vercel for production):\n");
for (const line of lines) console.log(line);
console.log(
  "\nNext: POLAR_WEBHOOK_SECRET from a Polar webhook endpoint pointing at\n" +
    "https://www.chromabrew.com/api/webhooks/polar — docs/BILLING_SETUP.md",
);
