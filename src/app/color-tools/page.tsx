import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import { siteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/site/json-ld";
import { defaultOgImage } from "@/lib/og";

/*
 * This page is deliberately NOT a second catalog.
 *
 * /tools is the complete directory, grouped by what a tool *is* (colour,
 * converter, CSS, image). This page answers a different question — "which
 * colour tool do I need right now?" — and is grouped by what the visitor
 * *wants to do*. The two must never converge: the audit flagged them as
 * competing for the same intent when this page listed the same cards with
 * the same blurbs as /tools. Here every card carries a task-framed line
 * written for this page only, and every one of the registry's tools appears
 * in exactly one task group.
 */
const TASK_GROUPS: {
  id: string;
  task: string;
  blurb: string;
  tools: { href: string; line: string }[];
}[] = [
  {
    id: "pick",
    task: "I'm picking colors for a new project",
    blurb:
      "Start from nothing or from a color you already love: generate harmonies, borrow a real brand anchor, or stretch one hue into a full scale.",
    tools: [
      {
        href: "/tools/color-palette-generator",
        line: "Turn one color into six harmony families — complementary to tetradic.",
      },
      {
        href: "/tools/brand-palettes",
        line: "Borrow the anchor hex of a famous brand and seed from it.",
      },
      {
        href: "/tools/shade-generator",
        line: "Stretch one color into an even 50–950 shade scale in OKLCH.",
      },
      {
        href: "/tools/color-mixer",
        line: "Blend two colors at any ratio and read the result live.",
      },
    ],
  },
  {
    id: "check",
    task: "I need to check my colors are accessible",
    blurb:
      "Measure instead of guessing: contrast ratios graded to WCAG, whole palettes audited at once, and every pair previewed the way color-blind viewers see it.",
    tools: [
      {
        href: "/tools/contrast-checker",
        line: "Grade any foreground/background pair to WCAG AA and AAA.",
      },
      {
        href: "/tools/wcag-palette-checker",
        line: "Audit every pair in a palette at once and spot the failures.",
      },
      {
        href: "/tools/color-blindness-simulator",
        line: "See any color or image under all eight color-vision deficiencies.",
      },
    ],
  },
  {
    id: "code",
    task: "I have a brand color and need it in code",
    blurb:
      "Paste the primary once and export a production-ready theme for the stack you actually ship.",
    tools: [
      {
        href: "/tools/tailwind-color-generator",
        line: "Turn one color into a Tailwind v4 @theme palette block.",
      },
      {
        href: "/tools/shadcn-theme-generator",
        line: "Generate an oklch shadcn/ui theme from your brand color.",
      },
      {
        href: "/tools/dark-mode-generator",
        line: "Derive an accessible dark theme instead of inverting colors.",
      },
      {
        href: "/tools/design-token-generator",
        line: "Export semantic tokens as DTCG JSON and CSS variables.",
      },
    ],
  },
  {
    id: "convert",
    task: "I need to convert, name or tweak a color",
    blurb:
      "The everyday lookups: every format at once, the closest CSS name, and transparency done properly.",
    tools: [
      {
        href: "/tools/color-converter",
        line: "See one color in HEX, RGB, HSL, CMYK and OKLCH side by side.",
      },
      {
        href: "/tools/color-names",
        line: "Find the closest of the 148 CSS named colors to any value.",
      },
      {
        href: "/tools/alpha-channel",
        line: "Add transparency and get HEX8, RGBA and opacity percentages.",
      },
    ],
  },
  {
    id: "images",
    task: "I'm working with images",
    blurb:
      "Pull palettes out of photos or move vector and raster graphics between formats — everything runs in your browser.",
    tools: [
      {
        href: "/tools/image-color-extractor",
        line: "Upload a photo and pull its dominant colors as a palette.",
      },
      {
        href: "/tools/svg-to-jpg",
        line: "Export SVGs as JPG at any scale, for social and email.",
      },
      {
        href: "/tools/jpg-to-svg",
        line: "Turn a raster image into clean vector paths.",
      },
    ],
  },
  {
    id: "css",
    task: "I want the CSS effects around the color",
    blurb:
      "The rest of a visual system: gradients, elevation shadows and type scales that sit on top of your palette.",
    tools: [
      {
        href: "/tools/css-gradient-generator",
        line: "Build linear, radial and conic gradients visually.",
      },
      {
        href: "/tools/css-shadow-generator",
        line: "Compose box-shadow and text-shadow values with sliders.",
      },
      {
        href: "/tools/typography-scale-generator",
        line: "Generate a modular type scale with pairings and CSS vars.",
      },
    ],
  },
];

export const metadata: Metadata = {
  // Budget: 47 chars here so the layout's " · ChromaBrew" template keeps the
  // rendered title inside the ~60-character SERP truncation point.
  title: "Color Tools by Task — Which Tool Do I Need?",
  description:
    "Not sure where to start? Pick what you want to do — make a palette, check contrast, convert a color, build CSS — and get the right free color tool for the job.",
  alternates: { canonical: "/color-tools" },
  openGraph: {
    title: "Color Tools by Task — Which Tool Do I Need?",
    description:
      "Not sure where to start? Pick what you want to do — make a palette, check contrast, convert a color, build CSS — and get the right free color tool for the job.",
    url: "/color-tools",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Color Tools by Task — Which Tool Do I Need?",
    description:
      "Pick what you want to do — make a palette, check contrast, convert a color, build CSS — and get the right free color tool for the job.",
    images: [defaultOgImage.url],
  },
};

export default function ColorToolsHubPage() {
  const byHref = new Map(TOOLS.map((tool) => [tool.href, tool]));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Which color tool do I need?",
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
            { "@type": "ListItem", position: 3, name: "Color tools by task", item: `${siteUrl}/color-tools` },
          ],
        }}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/tools" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">Tools</Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Color tools by task</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Which color tool do I need?
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Every free color tool on ChromaBrew, grouped by the job you are trying to finish — not by
          what the tool is. Pick the task closest to yours and open the tool that does it. All of
          them run in your browser, nothing is uploaded, and the same engines power the{" "}
          <Link
            href="/design-system"
            className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4"
          >
            color palette generator
          </Link>
          .
        </p>
      </header>

      {TASK_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`task-${group.id}`} className="mt-10">
          <h2 id={`task-${group.id}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {group.task}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">{group.blurb}</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {group.tools.map(({ href, line }) => {
              const tool = byHref.get(href);
              if (!tool) return null;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="group block h-full rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
                  >
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline group-hover:underline-offset-4">
                      {tool.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{line}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section aria-labelledby="browse-by-type" className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 id="browse-by-type" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Prefer to browse by type?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          The{" "}
          <Link
            href="/tools"
            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            full tools directory
          </Link>{" "}
          lists every tool grouped by what it is — color, converter, CSS and image — with the complete
          registry and FAQs.
        </p>
      </section>
    </div>
  );
}
