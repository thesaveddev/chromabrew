/**
 * Minimal analytics surface for Phase 1.
 *
 * Events are recorded through a pluggable sink so a real provider can be
 * connected later (Phase 2+) without touching call sites. The default sink
 * is a no-op: we deliberately do not ship invasive tracking.
 */
export type AnalyticsEvent =
  | "design_system_generated"
  | "palette_strategy_changed"
  | "contrast_checked"
  | "dark_mode_previewed"
  | "css_exported"
  | "tailwind_exported"
  | "shadcn_exported"
  | "json_exported"
  | "image_palette_generated"
  | "share_url_copied";

type Sink = (event: AnalyticsEvent, properties?: Record<string, string | number>) => void;

let sink: Sink = () => {};

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
