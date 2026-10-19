import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND_PALETTES } from "@/lib/brand-palettes";
import {
  brandSlug,
  brandBySlug,
  relatedBrands,
  brandCopy,
} from "@/lib/brand-pages";
import { buildColorReference } from "@/lib/color-reference";
import { CopyHexButton } from "@/components/palettes/copy-hex-button";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";

export const dynamicParams = false;
export const dynamic = "force-static";

export function generateStaticParams() {
  return BRAND_PALETTES.map((brand) => ({ slug: brandSlug(brand.name) }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = brandBySlug(slug);
  if (!brand) return {};
  return {
    title: `${brand.name} Brand Color`,
    description: `Reference color for ${brand.name} (${brand.hex}): values, scale, and measured contrast — plus how to use it as a design seed.`,
    alternates: { canonical: `/brands/${slug}` },
    openGraph: {
      title: `${brand.name} Brand Color (${brand.hex}) · ChromaBrew`,
      description: `The widely cited ${brand.name} anchor color with values, scale, and contrast — reference only, not official guidelines.`,
      url: `/brands/${slug}`,
      type: "article",
    },
  };
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const brand = brandBySlug(slug);
  if (!brand) notFound();
  const ref = buildColorReference(brand.hex);
  if (!ref) notFound();
  const copy = brandCopy(brand);
  const related = relatedBrands(brand);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${brand.name} Brand Color`,
          description: copy.lede,
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
          mainEntityOfPage: `${siteUrl}/brands/${slug}`,
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <Link href="/brands" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Brands
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">{brand.name}</span>
      </nav>

      <header className="mt-4">
        <div
          className="flex h-36 items-end justify-between rounded-xl border border-black/10 p-4"
          style={{ backgroundColor: brand.hex }}
        >
          <h1 className="text-2xl font-bold text-white mix-blend-difference">
            {brand.name}
          </h1>
          <CopyHexButton hex={brand.hex} />
        </div>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Reference value ({brand.hex.toUpperCase()}), not official {brand.name}{" "}
          brand guidelines. Confirm against their materials before shipping in
          their identity.
        </p>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {copy.lede}
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {copy.detail}
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Sector: {brand.sector}
        </p>
      </header>

      <section aria-labelledby="values" className="mt-10">
        <h2 id="values" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Values in every format
        </h2>
        <dl className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {(
            [
              ["HEX", ref.formats.hex],
              ["RGB", ref.formats.rgb],
              ["HSL", ref.formats.hsl],
              ["OKLCH", ref.formats.oklch],
              ["CMYK", ref.formats.cmyk],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-2.5 text-sm last:border-0 dark:border-zinc-800"
            >
              <dt className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</dt>
              <dd className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="scale" className="mt-10">
        <h2 id="scale" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Scale derived from the anchor
        </h2>
        <ol className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {ref.scale.map((stop) => (
            <li
              key={stop.step}
              className="flex items-center justify-between px-4 py-2 text-sm"
              style={{ backgroundColor: stop.hex }}
            >
              <span className="font-mono text-xs font-medium text-white mix-blend-difference">
                {stop.step}
                {stop.isSource ? " ★" : ""}
              </span>
              <span className="font-mono text-xs uppercase text-white mix-blend-difference">
                {stop.hex}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <Link
            href={`/design-system?primary=${brand.hex.replace("#", "")}`}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Use as a design seed
          </Link>
        </div>
      </section>

      <section aria-labelledby="contrast" className="mt-10">
        <h2 id="contrast" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Measured contrast
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {ref.contrast.map((row) => (
            <div
              key={row.backgroundName}
              className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 text-sm last:border-0 dark:border-zinc-800"
            >
              <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span
                  className="h-5 w-5 rounded border border-black/20"
                  style={{ backgroundColor: brand.hex }}
                  aria-hidden
                />
                on {row.backgroundName}
              </span>
              <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {row.ratio}:1 ·{" "}
                {row.aaNormal ? "AA normal ✓" : row.aaLarge ? "AA large only" : "fails AA"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="related" className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 id="related" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Related brands
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {related.map((other) => (
            <li key={other.name}>
              <Link
                href={`/brands/${brandSlug(other.name)}`}
                className="block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <span className="block h-14" style={{ backgroundColor: other.hex }} aria-hidden />
                <span className="block px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {other.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
