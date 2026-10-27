import Image from "next/image";
import Link from "next/link";

import { LinkButton } from "@/components/ui/primitives";

/**
 * The website audit's home-page section.
 *
 * It lives in its own file for the usual reason — the homepage has plenty of
 * its own composition — and for a second one: it is almost entirely claims, and
 * claims need to be checkable. As a plain component with no hooks and no
 * fetching it renders to static markup in a test, so a reworded sentence that
 * quietly outruns what the engine does fails there rather than shipping.
 *
 * The image is a real capture of a real run; `scripts/capture-audit-report.mjs`
 * records how it was taken and how to retake it. The numbers in the caption
 * describe that run, so re-capturing means updating them too.
 */

/** Inline text link used inside this section's copy. */
const INLINE_LINK =
  "underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100";

export function AuditSection() {
  return (
    <section
      aria-labelledby="audit-heading"
      className="border-t border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Free website audit
          </p>
          <h2
            id="audit-heading"
            className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
          >
            Audit a live page and see what is actually failing
          </h2>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Everything above decides a colour before you ship it. The audit reads the page you
            already shipped: paste a URL and it renders that page in a real browser, measures the
            text against the colours behind it, runs axe-core and ten structural rules, and shows its
            evidence — with a replacement that has been re-measured before it is offered.
          </p>
        </div>

        <figure className="mt-10">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800">
            <Image
              src="/audit-media/audit-report.png"
              alt="A real audit report: the scanned design-system page, the 1280×720 viewport screenshot the scanner captured, and a findings summary reading 2 critical, 7 high, 1 low and 1 informational issue."
              // Half the capture's 2304×2238 pixels: it is shot at
              // deviceScaleFactor 2, and the reserved box has to match the file's
              // aspect ratio exactly or the section shifts as the image loads.
              width={1152}
              height={1119}
              sizes="(min-width: 1280px) 1232px, 100vw"
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="mt-3 max-w-3xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            A real report, not a mockup: this site&apos;s own design-system generator page, rendered
            at 1280×720. The run found 11 issues — 2 of them rated critical — grouped one duplicate
            report, and proposed a fix for 9 of them, each recalculated against the measured ratio
            before it was shown.
          </figcaption>
        </figure>

        <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Rendered, not just fetched
            </dt>
            <dd className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              The page is loaded in headless Chromium at a desktop (1280×720) or mobile (390×844)
              viewport, so JavaScript-built content is analysed — and the screenshot above is the
              viewport as the scanner saw it.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Contrast measured from computed styles
            </dt>
            <dd className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Every run of text is graded against the colour actually behind it, including
              translucent text and text inside a translucent layer. A replacement is only offered
              once re-measuring it clears the required ratio.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              axe-core 4.13 plus ten structural rules
            </dt>
            <dd className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              WCAG 2.0–2.2 A and AA rules from axe-core, alongside checks for the page title and
              description, viewport meta, document language, image alt text, heading structure,
              indexability and the HTTP response itself.
            </dd>
          </div>
        </dl>

        <div className="mt-12 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            What one audit does not cover
          </h3>
          <ul className="mt-3 grid gap-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
            <li>One viewport per run — the whole-site scope crawls up to 5 same-origin pages, shallowest first.</li>
            <li>
              The automated rules are a subset of WCAG 2.2, so a clean report is not a conformance
              certificate.
            </li>
            <li>
              Text over an image, a gradient or a filter cannot be measured, and is reported as not
              measured rather than guessed at.
            </li>
            <li>
              Nothing is changed on your site: the report proposes a fix, and applying it stays your
              commit.
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <LinkButton href="/audit">Explore Website Audit</LinkButton>
          <Link
            href="/tools/contrast-checker"
            className="text-sm font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
          >
            or check one colour pair first
          </Link>
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Fix what it finds with the tools you already have here: grade two colours in the{" "}
          <Link href="/tools/contrast-checker" className={INLINE_LINK}>
            contrast checker
          </Link>
          , grade a whole palette at once in the{" "}
          <Link href="/tools/wcag-palette-checker" className={INLINE_LINK}>
            WCAG palette checker
          </Link>
          , rebuild a failing scale in the{" "}
          <Link href="/tools/shade-generator" className={INLINE_LINK}>
            shade generator
          </Link>
          , or generate an accessible dark theme with the{" "}
          <Link href="/tools/dark-mode-generator" className={INLINE_LINK}>
            dark mode generator
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
