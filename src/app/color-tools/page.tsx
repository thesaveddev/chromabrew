import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS, categoryLabel } from "@/lib/tools";
import { siteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/site/json-ld";

export const metadata: Metadata = {
  title: "Color Tools — Palettes, Contrast, Names & Converters",
  description:
    "Every color tool in one place: palette generator, brand color palettes, CSS color names finder, WCAG contrast checker, color blindness simulator, color converter and more — all free, no sign-up.",
  alternates: { canonical: "/color-tools" },
  openGraph: {
    title: "Color Tools — Palettes, Contrast, Names & Converters",
    description:
      "Every color tool in one place: palette generator, brand color palettes, CSS color names finder, WCAG contrast checker, color blindness simulator, color converter and more — all free, no sign-up.",
    url: "/color-tools",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Color Tools — Palettes, Contrast, Names & Converters",
    description:
      "Every color tool in one place: palette generator, WCAG contrast checker, color converter, CSS color names finder and more — all free.",
  },
};

const SUBSETS: { id: string; label: string; blurb: string; hrefs: string[] }[] = [
  {
    id: "generate",
    label: "Generate & convert colors",
    blurb: "Seed palettes, browse real brand colors, name any hex, and flip between HEX, RGB, HSL, CMYK and OKLCH.",
    hrefs: [
      "/tools/color-palette-generator",
      "/tools/brand-palettes",
      "/tools/color-names",
      "/tools/color-converter",
      "/tools/shade-generator",
      "/tools/color-mixer",
      "/tools/alpha-channel",
    ],
  },
  {
    id: "check",
    label: "Check accessibility",
    blurb: "Grade WCAG contrast, audit an entire palette at once, and preview how every tool's colors look to color-blind viewers.",
    hrefs: ["/tools/contrast-checker", "/tools/wcag-palette-checker", "/tools/color-blindness-simulator"],
  },
  {
    id: "build",
    label: "Build with CSS",
    blurb: "From one color to Tailwind themes, dark mode with real contrast, design tokens, gradients and shadows.",
    hrefs: [
      "/tools/tailwind-color-generator",
      "/tools/shadcn-theme-generator",
      "/tools/dark-mode-generator",
      "/tools/design-token-generator",
      "/tools/css-gradient-generator",
      "/tools/css-shadow-generator",
      "/tools/typography-scale-generator",
    ],
  },
];

export default function ColorToolsHubPage() {
  const byHref = new Map(TOOLS.map((tool) => [tool.href, tool]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Color Tools",
          url: `${siteUrl}/color-tools`,
          description: metadata.description,
          isPartOf: { "@type": "WebSite", name: "ChromaBrew", url: siteUrl },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Tools", item: `${siteUrl}/tools` },
            { "@type": "ListItem", position: 3, name: "Color tools", item: `${siteUrl}/color-tools` },
          ],
        }}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 dark:text-zinc-200 dark:hover:text-zinc-200">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/tools" className="hover:text-zinc-800 dark:text-zinc-200 dark:hover:text-zinc-200">Tools</Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Color tools</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Color tools
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Focused, free color tools backed by the same engines as the{" "}
          <Link
            href="/design-system"
            className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4"
          >
            color palette generator
          </Link>
          . Generate palettes, resolve color names, check WCAG contrast, preview color blindness, and
          build CSS — all in your browser, nothing uploaded.
        </p>
      </header>

      {SUBSETS.map((group) => {
        const tools = group.hrefs
          .map((href) => byHref.get(href))
          .filter((tool): tool is (typeof TOOLS)[number] => Boolean(tool));
        return (
          <section key={group.id} aria-labelledby={`hub-${group.id}`} className="mt-10">
            <h2 id={`hub-${group.id}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {group.label}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">{group.blurb}</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {tools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="group block h-full rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
                  >
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline group-hover:underline-offset-4">
                      {tool.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-zinc-500">{tool.blurb}</p>
                  </Link>
                </li>
              ))}
            </ul>
            {tools.length < group.hrefs.length ? (
              <p className="mt-2 text-xs text-zinc-400">More tools in this area are on the full tools page.</p>
            ) : null}
          </section>
        );
      })}

      <section aria-labelledby="hub-other" className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 id="hub-other" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Other tool areas
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {[["converter", "color-converter"], ["css", "css-gradient-generator"], ["image", "svg-to-jpg"]]
            .map(([category, example]) => {
              const tool = byHref.get(`/tools/${example}`);
              return tool
                ? {
                    href: "/tools",
                    title: `${categoryLabel(category as Parameters<typeof categoryLabel>[0])} tools`,
                    blurb: category === "converter"
                      ? "Every color in every format, plus SVG/JPG image conversion."
                      : category === "css"
                        ? "Gradients, shadows, typography scales and CSS color systems."
                        : "Extract colors from images and convert image formats.",
                  }
                : null;
            })
            .filter(Boolean)
            .map((group) => (
              <li key={group!.title}>
                <Link
                  href={group!.href}
                  className="group block h-full rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
                >
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline group-hover:underline-offset-4">
                    {group!.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-zinc-500">{group!.blurb}</p>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}