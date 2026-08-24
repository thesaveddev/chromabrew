import type { DesignSystem, ThemeMode } from "@/lib/design-system/types";
import { systemToStyle } from "./token-style";

/**
 * Frame that injects the generated semantic tokens (plus radius/shadow
 * primitives) as CSS variables so preview components can consume them with
 * `var(--ds-*)` utilities.
 */
export function PreviewFrame({
  system,
  mode,
  children,
  className = "",
}: {
  system: DesignSystem;
  mode: ThemeMode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      style={systemToStyle(system, mode)}
      className={`overflow-hidden rounded-xl border border-zinc-200 bg-white font-[family-name:var(--ds-font-sans)] shadow-sm dark:border-zinc-800 dark:bg-zinc-900 [&_h1]:font-[family-name:var(--ds-font-heading)] [&_h2]:font-[family-name:var(--ds-font-heading)] [&_h3]:font-[family-name:var(--ds-font-heading)] ${className}`}
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
