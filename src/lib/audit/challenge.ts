/**
 * Bot-protection challenge detection.
 *
 * A site behind Cloudflare may answer the scanner with a verification
 * interstitial instead of the page. Auditing that interstitial would produce a
 * confident report about a page that does not exist — missing title, no main
 * landmark, a handful of links to Cloudflare's own assets — and the reader
 * would take it as a verdict on their site. The one honest response is to say
 * what actually happened: the scan was blocked by bot verification, here is
 * how to let the scanner through.
 *
 * Detection is deterministic and cheap, and it prefers response metadata over
 * page text because that is where the provider announces itself:
 *
 *   1. `cf-mitigated` — Cloudflare's own response header, set when a bot
 *      management rule challenged (or blocked) the request. This is the
 *      authoritative signal; no page-text guessing needed.
 *   2. `server: cloudflare` on an error response whose body carries a known
 *      interstitial marker — the classic managed-challenge page.
 *   3. A known interstitial marker alone on an error response. Markers are
 *      deliberately specific strings ("cf-chl-", the interstitial's title),
 *      never the bare word "Cloudflare": a page that merely *mentions*
 *      Cloudflare must not be mistaken for a wall.
 *
 * Pure: no I/O, no clock. Both pipelines feed it what they already have —
 * headers from the response they just read, and the body they captured.
 */

export interface BotChallengeDetection {
  provider: "Cloudflare";
  /** Which signals fired, recorded as scan evidence. */
  evidence: string[];
}

export interface ChallengeInput {
  statusCode: number;
  /** The `server` response header, when the pipeline captured one. */
  server?: string | null;
  /** The `cf-mitigated` response header, when present. */
  cfMitigated?: string | null;
  /** The body as captured (rendered DOM or served HTML). */
  html: string;
}

/**
 * Body markers of the Cloudflare interstitial. Each is a string only that
 * interstitial carries — not marketing copy a scanned page might contain.
 */
const INTERSTITIAL_MARKERS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /just a moment/i, label: "interstitial title “Just a moment…”" },
  { pattern: /cf-chl-/i, label: "challenge script path (cf-chl-)" },
  { pattern: /cf_chl_opt/i, label: "challenge bootstrap (cf_chl_opt)" },
  { pattern: /\/cdn-cgi\/challenge-platform/i, label: "challenge platform asset (/cdn-cgi/challenge-platform/)" },
  { pattern: /attention required!\s*\|\s*cloudflare/i, label: "block page title (“Attention Required!”)" },
];

export function detectBotChallenge(input: ChallengeInput): BotChallengeDetection | null {
  const evidence: string[] = [];

  // 1. The provider said it in a header. `cf-mitigated` arrives with the
  //    challenged response; treat any value except an explicit non-action as
  //    a challenge (Cloudflare documents "challenge" and "block").
  if (input.cfMitigated) {
    evidence.push(`response header cf-mitigated: ${input.cfMitigated}`);
  }

  const isError = input.statusCode >= 400;
  const serverSaysCloudflare =
    typeof input.server === "string" && /cloudflare/i.test(input.server);
  const body = typeof input.html === "string" ? input.html : "";

  if (isError && serverSaysCloudflare) {
    const marker = INTERSTITIAL_MARKERS.find((m) => m.pattern.test(body));
    if (marker) {
      evidence.push(`server: cloudflare on HTTP ${input.statusCode} with ${marker.label}`);
    }
  }

  // 3. An error response wearing the interstitial itself, whatever the
  //    server header claims (proxies rewrite `server` often enough).
  if (isError && evidence.length === 0) {
    for (const marker of INTERSTITIAL_MARKERS) {
      if (marker.pattern.test(body)) {
        evidence.push(`HTTP ${input.statusCode} with ${marker.label}`);
        break;
      }
    }
  }

  if (evidence.length === 0) return null;
  return { provider: "Cloudflare", evidence };
}
