import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GALLERY_PALETTES,
  themeBySlug,
  paletteBySlug,
  relatedPalettes,
  paletteGeneratorHref,
} from "@/lib/palettes";
import { PaletteCard, PaletteSwatches } from "@/components/palettes/palette-card";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";
import { clampDescription } from "@/lib/meta";

export const dynamicParams = false;
export const dynamic = "force-static";

export function generateStaticParams() {
  return GALLERY_PALETTES.map((palette) => ({
    theme: palette.theme,
    palette: palette.slug,
  }));
}

interface Props {
  params: Promise<{ theme: string; palette: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { theme: themeSlug, palette: slug } = await params;
  const palette = paletteBySlug(themeSlug, slug);
  const theme = themeBySlug(themeSlug);
  if (!palette || !theme) return {};
  // The hex list is a bonus, not a right: when the pair overflows the SERP
  // truncation point, fall back to the prose alone rather than clamp mid-list.
  const withHex = `${palette.description} Hex values: ${palette.colors.join(", ")}.`;
  return {
    title: `${palette.name} Color Palette`,
    description: withHex.length <= 160 ? withHex : clampDescription(palette.description),
    alternates: { canonical: `/palettes/${themeSlug}/${slug}` },
    openGraph: {
      title: `${palette.name} (${theme.name} Palette) · ChromaBrew`,
      description: palette.description,
      url: `/palettes/${themeSlug}/${slug}`,
      type: "article",
    },
  };
}

export default async function PaletteDetailPage({ params }: Props) {
  const { theme: themeSlug, palette: slug } = await params;
  const palette = paletteBySlug(themeSlug, slug);
  const theme = themeBySlug(themeSlug);
  if (!palette || !theme) notFound();
  const related = relatedPalettes(palette);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${palette.name} Color Palette`,
          description: palette.description,
          author: {
            "@type": "Person",
            name: "Opeyemi Olorunfemi",
            url: `${siteUrl}/about`,
          },
          publisher: {
            "@type": "Organization",
            name: "ChromaBrew",
            url: siteUrl,
          },
          mainEntityOfPage: `${siteUrl}/palettes/${themeSlug}/${slug}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Palettes", item: `${siteUrl}/palettes` },
            { "@type": "ListItem", position: 3, name: theme.name, item: `${siteUrl}/palettes/${themeSlug}` },
            { "@type": "ListItem", position: 4, name: palette.name, item: `${siteUrl}/palettes/${themeSlug}/${slug}` },
          ],
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
        <Link href={`/palettes/${themeSlug}`} className="hover:text-zinc-800 dark:hover:text-zinc-200">
          {theme.name}
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">{palette.name}</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          {theme.name} palette
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {palette.name}
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {palette.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {palette.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-8">
        <PaletteSwatches palette={palette} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={paletteGeneratorHref(palette)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Open in generator
        </Link>
        <Link
          href="/tools/color-palette-generator"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Make palette variations
        </Link>
      </div>
      <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        The generator opens with {palette.colors[0]} as the primary and the
        next two stops as secondary and accent — adjust, check contrast, and
        export tokens or CSS from there.
      </p>

      <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Related palettes
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {related.map((other) => (
            <li key={`${other.theme}/${other.slug}`}>
              <PaletteCard palette={other} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link
            href={`/palettes/${themeSlug}`}
            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            Browse all {theme.name.toLowerCase()} palettes →
          </Link>
        </p>
      </section>
    </div>
  );
}
