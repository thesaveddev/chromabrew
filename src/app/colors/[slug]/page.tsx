import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NAMED_COLORS, colorBySlug, relatedColors } from "@/lib/colors";
import { buildColorReference } from "@/lib/color-reference";
import { CopyHexButton } from "@/components/palettes/copy-hex-button";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";
import { clampDescription } from "@/lib/meta";

export const dynamicParams = false;
export const dynamic = "force-static";

export function generateStaticParams() {
  return NAMED_COLORS.map((color) => ({ slug: color.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const color = colorBySlug(slug);
  if (!color) return {};
  return {
    title: `${color.name} Color — HEX, RGB & Shades`,
    // Composed from data — the per-color prose varies, so clamp the result.
    description: clampDescription(
      `${color.name} (${color.hex}): ${color.description.split(".")[0]}. Values, scale and contrast.`,
    ),
    alternates: { canonical: `/colors/${slug}` },
    openGraph: {
      title: `${color.name} (${color.hex}) · ChromaBrew`,
      description: color.description,
      url: `/colors/${slug}`,
      type: "article",
    },
  };
}

export default async function ColorDetailPage({ params }: Props) {
  const { slug } = await params;
  const color = colorBySlug(slug);
  if (!color) notFound();
  const ref = buildColorReference(color.hex);
  if (!ref) notFound();
  const related = relatedColors(color);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${color.name} Color — HEX, RGB & Shades`,
          description: color.description,
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
          mainEntityOfPage: `${siteUrl}/colors/${slug}`,
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <Link href="/colors" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Colors
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">{color.name}</span>
      </nav>

      <header className="mt-4">
        <div
          className="flex h-36 items-end justify-between rounded-xl border border-black/10 p-4"
          style={{ backgroundColor: color.hex }}
        >
          <h1 className="text-2xl font-bold text-white mix-blend-difference">
            {color.name}
          </h1>
          <CopyHexButton hex={color.hex} />
        </div>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {color.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {color.uses.map((use) => (
            <span
              key={use}
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {use}
            </span>
          ))}
        </div>
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
        <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Hue family: {ref.hueFamily} · closest CSS name: {ref.closestName}.{" "}
          <Link href="/tools/color-converter" className="font-medium underline underline-offset-4">
            Convert this color
          </Link>
        </p>
      </section>

      <section aria-labelledby="scale" className="mt-10">
        <h2 id="scale" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Perceptual shade scale
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Eleven even steps from 50 to 950, computed in OKLCH — the starred
          stop is {color.hex} itself.
        </p>
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
        <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          <Link href={`/design-system?primary=${color.hex.replace("#", "")}`} className="font-medium underline underline-offset-4">
            Build a full system from {color.hex}
          </Link>
        </p>
      </section>

      <section aria-labelledby="harmonies" className="mt-10">
        <h2 id="harmonies" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Harmonies with {color.name.toLowerCase()}
        </h2>
        <div className="mt-4 space-y-4">
          {ref.harmonies.map((harmony) => (
            <div
              key={harmony.name}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {harmony.name}
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {harmony.blurb}
              </p>
              <div className="mt-3 flex gap-2">
                {harmony.colors.map((hex) => (
                  <Link
                    key={hex}
                    href={`/tools/color-mixer`}
                    title={`${hex} — open the mixer`}
                    className="h-12 flex-1 rounded-lg border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {harmony.colors.join("  ")}
              </p>
            </div>
          ))}
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
                  style={{ backgroundColor: color.hex }}
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
        <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          <Link href="/tools/contrast-checker" className="font-medium underline underline-offset-4">
            Check your own pairs
          </Link>
        </p>
      </section>

      <section aria-labelledby="related" className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 id="related" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Related colors
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {related.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/colors/${other.slug}`}
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
