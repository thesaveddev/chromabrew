"use client";

import { RADIUS_STYLES, TYPE_RATIOS } from "@/lib/design-system/primitives/generate";
import type {
  DesignSystem,
  RadiusStyle,
  TypeScaleRatio,
} from "@/lib/design-system/types";
import { CopyButton, TabList } from "@/components/ui/primitives";

/**
 * Configuration + inspection of the mode-independent primitives:
 * type scale, spacing, radii and elevation shadows.
 */
export function PrimitivesPanel({
  system,
  onRadiusChange,
  onTypeRatioChange,
}: {
  system: DesignSystem;
  onRadiusChange: (style: RadiusStyle) => void;
  onTypeRatioChange: (ratio: TypeScaleRatio) => void;
}) {
  const { typography, spacing, radius, shadows } = system.primitives;

  return (
    <section aria-labelledby="primitives-heading" className="space-y-4">
      <h2 id="primitives-heading" className="panel-title">
        Layout primitives
      </h2>

      {/* Knobs */}
      <div className="grid gap-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Radius style</p>
          <TabList
            label="Radius style"
            size="sm"
            options={RADIUS_STYLES.map((s) => ({ id: s, label: s }))}
            value={system.configuration.radiusStyle}
            onChange={(id) => onRadiusChange(id as RadiusStyle)}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Type scale</p>
          <TabList
            label="Type scale ratio"
            size="sm"
            options={Object.entries(TYPE_RATIOS).map(([label, value]) => ({
              id: String(value),
              label: `${label} ${value}`,
            }))}
            value={String(system.configuration.typeRatio)}
            onChange={(id) => onTypeRatioChange(Number(id) as TypeScaleRatio)}
          />
        </div>
      </div>

      {/* Typography */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left text-xs">
          <caption className="sr-only">Typography tokens</caption>
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <th scope="col" className="px-3 py-2 font-medium">Step</th>
              <th scope="col" className="px-3 py-2 font-medium">Size / LH</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                <span className="sr-only">Copy</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(typography.fontSize).map(([name, step]) => (
              <tr key={name} className="border-b border-zinc-100 dark:border-zinc-800/70 last:border-0 dark:border-zinc-800/60">
                <td className="px-3 py-1.5 font-semibold" style={{ fontSize: step.size }}>
                  {name}
                </td>
                <td className="px-3 py-1.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                  {step.size} / {step.lineHeight}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <CopyButton
                    value={`font-size: ${step.size};\nline-height: ${step.lineHeight};`}
                    label="Copy"
                    className="!px-2 !py-0.5 text-[11px]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Spacing */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Spacing (4px base)</p>
          <CopyButton
            value={Object.entries(spacing)
              .map(([k, v]) => `--space-${k}: ${v};`)
              .join("\n")}
            label="Copy all"
            className="!px-2 !py-0.5 text-[11px]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(spacing).map(([key, value]) => (
            <span
              key={key}
              title={value}
              className="rounded-md border border-zinc-200 px-1.5 py-1 font-mono text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500"
            >
              <span aria-hidden className="mr-1 inline-block h-1.5 rounded-sm align-middle bg-zinc-300 dark:bg-zinc-700" style={{ width: value }} />
              {key}
            </span>
          ))}
        </div>
      </div>

      {/* Radius + shadows */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Radii</p>
          <div className="flex flex-wrap gap-2">
            {(["sm", "md", "lg", "xl", "full"] as const).map((name) => (
              <span
                key={name}
                title={`${radius[name]} (${name})`}
                aria-hidden
                className="h-9 w-9 border border-zinc-300 dark:border-zinc-700 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                style={{ borderRadius: radius[name] }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Elevation</p>
          <div className="flex flex-wrap gap-3">
            {(["sm", "md", "lg", "xl"] as const).map((name) => (
              <span
                key={name}
                title={`--shadow-${name}`}
                className="grid h-9 w-12 place-items-center rounded-lg bg-white text-[9px] font-medium text-zinc-400 dark:bg-zinc-950"
                style={{ boxShadow: shadows[name] }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-4 text-zinc-400">
        Exports include these as CSS variables (--font-size-*, --space-*,
        --radius-*, --shadow-*) and native Tailwind v4 theme namespaces.
      </p>
    </section>
  );
}
