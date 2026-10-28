import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import { ToolsExplorer } from "@/components/tools/tools-explorer";
import { siteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/site/json-ld";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  // Both were over the limits the audit reports: the rendered title measured 74
  // characters (with the site-name suffix the layout appends) and the
  // description 251, so search results truncated them.
  title: "Free Color Tools — Palette & Contrast Checker",
  // Counted from the registry rather than typed in, so adding a tool cannot
  // leave this page understating what it links to.
  description:
    `${TOOLS.length} free tools: palette generator, brand palettes, image color extractor, WCAG contrast checker, llms.txt generator, CSS gradient generator.`,
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Free Color Tools — Palette & Contrast Checker",
    description:
      `${TOOLS.length} free tools: palette generator, brand palettes, image color extractor, WCAG contrast checker, llms.txt generator, CSS gradient generator.`,
    url: "/tools",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Color Tools — Palette & Contrast Checker",
    description:
      `${TOOLS.length} free tools: color palette generator, WCAG contrast checker, llms.txt generator, image color extractor, CSS gradient generator and more.`,
    images: [defaultOgImage.url],
  },
};

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Free Color Tools",
          url: `${siteUrl}/tools`,
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
          ],
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Tools</span>
      </nav>
      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Free color &amp; design token tools
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Focused single-purpose color tools powered by the same engines behind the{" "}
          <Link
            href="/design-system"
            className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4"
          >
            color palette generator
          </Link>
          . Generate color palettes, extract colors from images, check WCAG contrast ratios,
          simulate color blindness, create CSS gradients, and build Tailwind CSS themes — all free, no sign-up.
        </p>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Not sure which tool you need? The{" "}
          <Link href="/color-tools" className="font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
            color tool finder
          </Link>{" "}
          matches the task in your head to the tool that does it.
        </p>
      </header>

      <ToolsExplorer />
    </div>
  );
}