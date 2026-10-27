import Link from "next/link";
import { PALETTE_THEMES, palettesForTheme } from "@/lib/palettes";

/**
 * Every theme as a color tile: the theme's first palettes stacked as full
 * rows, so each palette stays readable. Browsing starts by feeling, not by
 * reading.
 *
 * This used to flatten every palette of the theme into one striped swatch.
 * At 1000 palettes that is thousands of sub-pixel stripes — visual mush.
 * Five whole palettes at a legible height carry the mood instead.
 */
const PREVIEW_PALETTES = 5;

export function ThemeMosaic() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PALETTE_THEMES.map((theme) => {
        const palettes = palettesForTheme(theme.slug);
        const preview = palettes.slice(0, PREVIEW_PALETTES);
        return (
          <Link
            key={theme.slug}
            href={`/palettes/${theme.slug}`}
            className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="block" aria-hidden>
              {preview.map((palette) => (
                <span key={palette.slug} className="flex h-9">
                  {palette.colors.map((color) => (
                    <span
                      key={color}
                      className="h-full flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
              ))}
            </span>
            <span className="block px-4 py-3">
              <span className="block text-base font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                {theme.name}
              </span>
              <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
                {palettes.length} palettes
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
