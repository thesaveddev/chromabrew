import Link from "next/link";
import { PALETTE_THEMES, palettesForTheme } from "@/lib/palettes";

/**
 * Every theme as a color tile: the theme's palettes compressed into one
 * striped swatch. Browsing starts by feeling, not by reading.
 */
export function ThemeMosaic() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {PALETTE_THEMES.map((theme) => {
        const palettes = palettesForTheme(theme.slug);
        const stripe = palettes.flatMap((p) => p.colors);
        return (
          <Link
            key={theme.slug}
            href={`/palettes/${theme.slug}`}
            className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-20" aria-hidden>
              {stripe.map((color, i) => (
                <span
                  key={`${color}-${i}`}
                  className="h-full flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            <span className="block px-3 py-2.5">
              <span className="block text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                {theme.name}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                {palettes.length} palettes
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
