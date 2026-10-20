import { GALLERY_PALETTES } from "@/lib/palettes";

/**
 * A full-bleed ribbon of every curated palette, drifting sideways — the one
 * orchestrated motion moment on the page. Pure CSS, duplicated for a seamless
 * loop, paused for reduced motion and on hover.
 */
export function PaletteRibbon() {
  const strips = [...GALLERY_PALETTES, ...GALLERY_PALETTES];
  return (
    <div className="overflow-hidden border-y border-zinc-200 dark:border-zinc-800" aria-hidden>
      <div className="ribbon-track flex w-max">
        {strips.map((palette, i) => (
          <span key={`${palette.slug}-${i}`} className="flex h-14 w-40 shrink-0 sm:h-16 sm:w-52">
            {palette.colors.map((color) => (
              <span
                key={color}
                className="h-full flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
