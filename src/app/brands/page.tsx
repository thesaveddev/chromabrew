import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_PALETTES, BRAND_SECTORS } from "@/lib/brand-palettes";
import { brandsForSector } from "@/lib/brand-pages";
import { brandSlug } from "@/lib/brand-pages";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Brand Color Reference",
  description:
    "Reference colors for 98 recognisable brands by sector — copy any hex or use it as a seed for a full accessible design system.",
  alternates: { canonical: "/brands" },
  openGraph: {
    title: "Brand Color Reference · ChromaBrew",
    description:
      "98 brand reference colors by sector. Copy hex or generate a system from any seed.",
    url: "/brands",
    type: "website",
    images: [defaultOgImage],
  },
};

export const dynamic = "force-static";

export default function BrandsIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Brand Color Reference",
          description:
            "Widely published reference colors for recognisable brands, organised by sector.",
          url: `${siteUrl}/brands`,
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Brands</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Brand reference
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Brand colors, referenced honestly.
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Widely published anchor colors for {BRAND_PALETTES.length} recognisable
          brands, organised by sector. Copy any hex or open it as a seed in the
          generator — these are references, not official guidelines.
        </p>
      </header>

      {BRAND_SECTORS.map((sector) => (
        <section key={sector} className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {sector}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brandsForSector(sector).map((brand) => (
              <li key={brand.name}>
                <Link
                  href={`/brands/${brandSlug(brand.name)}`}
                  className="lift flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span
                    className="h-12 w-12 shrink-0 rounded-lg border border-black/10"
                    style={{ backgroundColor: brand.hex }}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {brand.name}
                    </span>
                    <span className="block font-mono text-xs uppercase text-zinc-500 dark:text-zinc-400">
                      {brand.hex}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-12 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Reference values, not official brand guidelines — confirm against each
        brand&apos;s own materials before shipping in their identity. Prefer to
        search and filter?{" "}
        <Link href="/tools/brand-palettes" className="font-medium underline underline-offset-4">
          Use the brand palettes tool
        </Link>
        .
      </p>
    </div>
  );
}
