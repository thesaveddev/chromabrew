import { GALLERY_PALETTES } from "@/lib/palettes";

/**
 * A full-bleed ribbon of curated palettes, drifting sideways — the one
 * orchestrated motion moment on the page. Pure CSS, duplicated for a seamless
 * loop, paused for reduced motion and on hover.
 *
 * Only a slice of the catalog rides here: at 1000 palettes a full-catalog
 * track crosses the viewport thousands of pixels per second and reads as a
 * blur, and it costs thousands of DOM nodes. 64 strips at 200s per loop is
 * roughly 55px/s — a calm drift.
 */
export function PaletteRibbon() {
  const sample = GALLERY_PALETTES.slice(0, 64);
  const strips = [...sample, ...sample];
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
