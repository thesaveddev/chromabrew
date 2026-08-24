/**
 * Minimal analytics surface for Phase 1.
 *
 * Events are recorded through a pluggable sink so a real provider can be
 * connected later (Phase 2+) without touching call sites. The default sink
 * is a no-op: we deliberately do not ship invasive tracking.
 */
export type AnalyticsEvent =
  | "design_system_generated"
  | "palette_randomized"
  | "palette_strategy_changed"
  | "contrast_checked"
  | "dark_mode_previewed"
  | "css_exported"
  | "tailwind_exported"
  | "shadcn_exported"
  | "json_exported"
  | "image_palette_generated"
  | "share_url_copied"
  | "project_created"
  | "project_updated"
  | "bootstrap_exported"
  | "mui_exported"
  | "antd_exported"
  | "chakra_exported"
  | "figma_exported"
  | "react_native_exported"
  | "flutter_exported"
  | "ios_exported"
  | "android_exported"
  | "feedback_submitted"
  | "ai_palette_suggested";

type Sink = (event: AnalyticsEvent, properties?: Record<string, string | number>) => void;

interface VercelAnalyticsWindow {
  va?: (event: string, properties?: Record<string, string | number>) => void;
}

/**
 * Default sink: forward to Vercel Analytics custom events when the script
 * is active (production on Vercel). It is cookie-less and PII-free; the
 * call sites stay provider-agnostic — swap this sink to integrate
 * Plausible/GA4/PostHog later without touching product code.
 */
const vercelSink: Sink = (event, properties) => {
  if (typeof window === "undefined") return;
  const va = (window as unknown as VercelAnalyticsWindow).va;
  if (typeof va === "function") va(event, properties);
};

let sink: Sink = vercelSink;

export function setAnalyticsSink(next: Sink): void {
  sink = next;
}

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number>,
): void {
  try {
    sink(event, properties);
  } catch {
    // Analytics must never break the product.
  }
}
