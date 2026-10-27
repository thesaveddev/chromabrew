import Link from "next/link";

import { analyzeBrandFit } from "@/lib/audit/brand-fit";
import type { ScannedPageDto } from "@/lib/audit/types";

/**
 * Do the site's colours suit what it sells? The dominant colours come from
 * the audit's own measurements (no new capture), the category from the
 * site's own words, and a misfit links straight into the design system
 * generator with a better-homed replacement pre-selected.
 *
 * Renders nothing when there is nothing honest to say: no recognisable
 * category, no chromatic colours, or a fetch-only scan with no computed
 * styles. A missing section beats an invented opinion.
 */
export function BrandFitPanel({ page }: { page: ScannedPageDto }) {
  const fit = analyzeBrandFit({
    title: page.title,
    url: page.url,
    histogram: page.colorHistogram,
  });
  if (!fit) return null;

  const misfits = fit.colors.filter((color) => !color.fit);
  return (
    <section
      aria-label="Brand colour fit"
      className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Brand colours for {fit.categoryLabel.toLowerCase()}
      </h2>
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        {misfits.length === 0
          ? `The colours this page leans on sit where ${fit.categoryLabel.toLowerCase()} brands usually live — a heuristic read of the measured palette, not a design judgment.`
          : `Heuristic read of the measured palette: ${misfits.length === 1 ? "one colour sits" : `${misfits.length} colours sit`} outside where ${fit.categoryLabel.toLowerCase()} brands usually live. Worth a look, not a failure.`}
      </p>
      <ul className="mt-4 space-y-2.5">
        {fit.colors.map((color) => (
          <li key={color.hex} className="flex items-center gap-3 text-sm">
            <span
              aria-hidden="true"
              className="h-8 w-8 shrink-0 rounded-lg border border-black/10 dark:border-white/10"
              style={{ backgroundColor: color.hex }}
            />
            <span className="min-w-0 flex-1">
              <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                {color.hex}
              </span>{" "}
              <span className="text-xs capitalize text-zinc-500 dark:text-zinc-400">
                {color.role}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                color.fit
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {color.fit ? "Fits" : `${color.distance}° off`}
            </span>
          </li>
        ))}
      </ul>
      {fit.suggestions.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {fit.suggestions.map((suggestion) => (
            <li
              key={suggestion.from}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400"
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 rounded border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: suggestion.from }}
                />
                <span aria-hidden="true">→</span>
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 rounded border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: suggestion.to }}
                />
              </span>
              <span className="font-mono">
                {suggestion.from} → {suggestion.to}
              </span>
              <span className="capitalize">{suggestion.role} replacement</span>
              <Link
                href={suggestion.generatorHref}
                className="ml-auto font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                Preview in generator
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
