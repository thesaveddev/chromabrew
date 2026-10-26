import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PALETTE_THEMES,
  themeBySlug,
  palettesForTheme,
} from "@/lib/palettes";
import { PaletteCard } from "@/components/palettes/palette-card";
import { ThemePaletteGrid } from "@/components/palettes/theme-palette-grid";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";
import { defaultOgImage } from "@/lib/og";
import { clampDescription } from "@/lib/meta";

export const dynamicParams = false;
export const dynamic = "force-static";

export function generateStaticParams() {
  return PALETTE_THEMES.map((theme) => ({ theme: theme.slug }));
}

interface Props {
  params: Promise<{ theme: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { theme: slug } = await params;
  const theme = themeBySlug(slug);
  if (!theme) return {};
  return {
    title: `${theme.name} Color Palettes`,
    // Composed from data, so clamp rather than trust the tagline's length.
    description: clampDescription(
      `${theme.tagline} ${palettesForTheme(slug).length} hand-picked palettes — copy hex or open in the generator.`,
    ),
    alternates: { canonical: `/palettes/${slug}` },
    openGraph: {
      title: `${theme.name} Color Palettes · ChromaBrew`,
      description: theme.tagline,
      url: `/palettes/${slug}`,
      type: "website",
      images: [defaultOgImage],
    },
  };
}

export default async function ThemePage({ params }: Props) {
  const { theme: slug } = await params;
  const theme = themeBySlug(slug);
  if (!theme) notFound();
  const palettes = palettesForTheme(slug);
  const others = PALETTE_THEMES.filter((t) => t.slug !== slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${theme.name} Color Palettes`,
          description: theme.tagline,
          url: `${siteUrl}/palettes/${slug}`,
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <Link href="/palettes" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Palettes
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">{theme.name}</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          {palettes.length} curated palettes
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {theme.name} color palettes
        </h1>
        {theme.intro.map((paragraph) => (
          <p key={paragraph} className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {paragraph}
          </p>
        ))}
      </header>

      <ThemePaletteGrid palettes={palettes} />

      <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          More palette themes
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/palettes/${other.slug}`}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {other.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
