/**
 * Minimal analytics surface for Phase 1.
 *
 * Events are recorded through a pluggable sink so a real provider can be
 * connected later (Phase 2+) without touching call sites. The default sink
 * is a no-op: we deliberately do not ship invasive tracking.
 */
export type AnalyticsEvent =
  | "hero_generator_clicked"
  | "hero_audit_clicked"
  | "login_clicked"
  | "go_pro_clicked"
  | "design_system_generated"
  | "code_copied_or_exported"
  | "project_saved"
  | "pro_checkout_started"
  | "pro_purchase_completed"
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
  | "w3c_exported"
  | "penpot_exported"
  | "design_system_zip_exported"
  | "react_native_exported"
  | "flutter_exported"
  | "ios_exported"
  | "android_exported"
  | "feedback_submitted"
  | "ai_palette_suggested"
  | "colors_mixed"
  | "tailwind_theme_copied"
  | "shadcn_theme_copied"
  | "dark_theme_copied"
  | "tokens_copied"
  | "audit_started"
  | "audit_completed"
  | "signup_completed"
  | "ai_files_downloaded";

type Sink = (event: AnalyticsEvent, properties?: Record<string, string | number>) => void;

interface UmamiWindow {
  umami?: {
    track?: (event: string, data?: Record<string, string | number>) => void;
  };
}

/**
 * Default sink: forward to self-hosted Umami custom events when the tracker
 * script is active. It is cookie-less and PII-free; the call sites stay
 * provider-agnostic.
 */
const umamiSink: Sink = (event, properties) => {
  if (typeof window === "undefined") return;
  const trackFn = (window as unknown as UmamiWindow).umami?.track;
  if (typeof trackFn === "function") trackFn(event, properties);
};

let sink: Sink = umamiSink;

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
