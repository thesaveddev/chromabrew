import type { Metadata } from "next";
import Link from "next/link";
import {
  PALETTE_THEMES,
  GALLERY_PALETTES,
  MINTED_PER_THEME,
  palettesForTheme,
} from "@/lib/palettes";
import { PaletteCard } from "@/components/palettes/palette-card";
import { PaletteExplorer } from "@/components/palettes/palette-explorer";
import { LazyThemeSection } from "@/components/palettes/lazy-theme-section";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Color Palette Gallery",
  description:
    "Hand-picked color palettes by theme — retro, pastel, earthy, ocean, neon, jewel and more. Search by color or mood, copy any hex, or open in the generator.",
  alternates: { canonical: "/palettes" },
  openGraph: {
    title: "Color Palette Gallery · ChromaBrew",
    description:
      "Hand-picked palettes by theme. Copy hex values or turn any palette into a full accessible design system.",
    url: "/palettes",
    type: "website",
    images: [defaultOgImage],
  },
};

export const dynamic = "force-static";

export default function PalettesIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Color Palette Gallery",
          description:
            "Hand-picked color palettes organised by theme, each usable as a design system starting point.",
          url: `${siteUrl}/palettes`,
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Palettes</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Palette gallery
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Palettes picked by humans, ready for code.
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Every palette is curated — five stops that work together — and every
          one opens directly in the design system generator. Search the whole
          collection, browse by theme, copy any hex, or turn a palette into
          tokens, themes, and CSS.
        </p>
      </header>

      <PaletteExplorer palettes={GALLERY_PALETTES} themes={PALETTE_THEMES} />

      {PALETTE_THEMES.map((theme, index) => {
        const palettes = palettesForTheme(theme.slug);
        const total = palettes.length + MINTED_PER_THEME;
        const preview = palettes
          .flatMap((p) => p.colors)
          .slice(0, 10);
        return (
          <LazyThemeSection key={theme.slug} eager={index === 0}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  <Link
                    href={`/palettes/${theme.slug}`}
                    className="hover:underline"
                  >
                    {theme.name} palettes
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {theme.tagline}
                </p>
              </div>
              <Link
                href={`/palettes/${theme.slug}`}
                className="shrink-0 text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                All {total.toLocaleString()} →
              </Link>
            </div>
            <div className="mt-3 flex h-12 overflow-hidden rounded-lg" aria-hidden>
              {preview.map((color, i) => (
                <span
                  key={`${color}-${i}`}
                  className="h-full flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {palettes.slice(0, 2).map((palette) => (
                <li key={palette.slug}>
                  <PaletteCard palette={palette} />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Showing 2 of {total.toLocaleString()} —{" "}
              <Link
                href={`/palettes/${theme.slug}`}
                className="font-medium underline underline-offset-4"
              >
                browse all {theme.name.toLowerCase()} palettes
              </Link>
              .
            </p>
          </LazyThemeSection>
        );
      })}

      <p className="mt-12 text-xs text-zinc-500 dark:text-zinc-400">
        {GALLERY_PALETTES.length} curated palettes across {PALETTE_THEMES.length}{" "}
        themes — plus {MINTED_PER_THEME.toLocaleString()} more per theme,
        every one with its own page. Made something of your own?{" "}
        <Link href="/design-system" className="font-medium underline underline-offset-4">
          Generate a design system
        </Link>{" "}
        from any color.
      </p>
    </div>
  );
}
