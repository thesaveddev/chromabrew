import Link from "next/link";
import type { GalleryPalette } from "@/lib/palettes";
import { CopyHexButton } from "./copy-hex-button";

/** A palette as a clickable strip of five swatches with its name. */
export function PaletteCard({ palette }: { palette: GalleryPalette }) {
  const href = `/palettes/${palette.theme}/${palette.slug}`;
  return (
    <Link
      href={href}
      className="group lift block overflow-hidden rounded-xl border border-zinc-200 bg-white hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span className="flex h-20" aria-hidden>
        {palette.colors.map((color) => (
          <span
            key={color}
            className="h-full flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className="block px-4 py-3">
        <span className="block text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
          {palette.name}
        </span>
        <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {palette.colors.join("  ")}
        </span>
      </span>
    </Link>
  );
}

/** Five large swatches with per-color copy buttons, for the detail page. */
export function PaletteSwatches({ palette }: { palette: GalleryPalette }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      {palette.colors.map((color) => (
        <div
          key={color}
          className="flex items-center justify-between px-4 py-5"
          style={{ backgroundColor: color }}
        >
          <span className="font-mono text-sm font-medium uppercase tracking-wider text-white mix-blend-difference">
            {color}
          </span>
          <CopyHexButton hex={color} />
        </div>
      ))}
    </div>
  );
}
