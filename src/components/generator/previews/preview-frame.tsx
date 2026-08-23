import type { DesignSystem } from "@/lib/design-system/types";
import { tokensToStyle } from "./token-style";

/**
 * Frame that injects the generated semantic tokens as CSS variables so
 * preview components can consume them with `var(--ds-*)` utilities.
 */
export function PreviewFrame({
  system,
  mode,
  children,
  className = "",
}: {
  system: DesignSystem;
  mode: "light" | "dark";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      style={tokensToStyle(system.themes[mode])}
      className={`overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function BarChartPlaceholder({
  colours,
}: {
  colours: string[];
}) {
  const heights = [42, 68, 55, 80, 62, 90, 74];
  return (
    <div className="flex h-16 items-end gap-1.5" aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-full rounded-t-[3px]"
          style={{ height: `${h}%`, backgroundColor: colours[i % colours.length], opacity: i % 2 ? 0.85 : 1 }}
        />
      ))}
    </div>
  );
}
