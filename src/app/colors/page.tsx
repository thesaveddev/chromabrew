import type { Metadata } from "next";
import Link from "next/link";
import { COLOR_FAMILIES, NAMED_COLORS, colorsForFamily } from "@/lib/colors";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Color Reference",
  description:
    "Every common color with HEX, RGB, HSL, and OKLCH values, perceptual shade scales, harmonies, and measured contrast — 37 reference pages.",
  alternates: { canonical: "/colors" },
  openGraph: {
    title: "Color Reference · ChromaBrew",
    description:
      "HEX, RGB, HSL, OKLCH, shade scales, harmonies, and contrast for 37 colors.",
    url: "/colors",
    type: "website",
    images: [defaultOgImage],
  },
};

export const dynamic = "force-static";

export default function ColorsIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Color Reference",
          description:
            "Reference pages for common colors: values, scales, harmonies, and contrast.",
          url: `${siteUrl}/colors`,
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Colors</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Color reference
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Every color, fully specified.
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Pick a color for its HEX, RGB, HSL, and OKLCH values, an 11-step
          perceptual scale, ready-made harmonies, and contrast ratios measured
          against white and black — then open it in any tool.
        </p>
      </header>

      {COLOR_FAMILIES.map((family) => (
        <section key={family} className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {family}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colorsForFamily(family).map((color) => (
              <li key={color.slug}>
                <Link
                  href={`/colors/${color.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span
                    className="h-12 w-12 shrink-0 rounded-lg border border-black/10"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {color.name}
                    </span>
                    <span className="block font-mono text-xs uppercase text-zinc-500 dark:text-zinc-400">
                      {color.hex}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-12 text-xs text-zinc-500 dark:text-zinc-400">
        {NAMED_COLORS.length} reference colors. Looking for combinations rather
        than single colors?{" "}
        <Link href="/palettes" className="font-medium underline underline-offset-4">
          Browse the palette gallery
        </Link>
        .
      </p>
    </div>
  );
}
