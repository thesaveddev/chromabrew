/**
 * Server-side Polar client — lazy so builds without billing env vars still
 * compile (same pattern as the old Stripe helper). Never import from client
 * components: the access token stays on the server.
 */
import { createPolar, type Polar } from "@polar-sh/sdk/2026-10";
import { POLAR_ENVIRONMENT } from "./config";

let _polar: Polar | null = null;

export function getPolar(): Polar {
  if (!_polar) {
    if (!process.env.POLAR_ACCESS_TOKEN) {
      throw new Error("POLAR_ACCESS_TOKEN is not set");
    }
    _polar = createPolar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      environment: POLAR_ENVIRONMENT,
    });
  }
  return _polar;
}
