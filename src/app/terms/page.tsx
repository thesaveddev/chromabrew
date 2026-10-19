import type { Metadata } from "next";
import Link from "next/link";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms for using ChromaBrew's free color tools, design system generator, guides, and website audit.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Use · ChromaBrew",
    description:
      "Acceptable use, accounts, audit rules, and liability for ChromaBrew's free tools.",
    url: "/terms",
    type: "website",
    images: [defaultOgImage],
  },
};

const EFFECTIVE_DATE = "October 19, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Terms of Use</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Terms of Use
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Fair rules for free tools.
        </h1>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Effective date: {EFFECTIVE_DATE}
        </p>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          These terms cover the free color tools, design system generator,
          guides, and website audit on chromabrew.com. Using the site means you
          accept them.
        </p>
      </header>

      <div className="mt-8 space-y-8 border-t border-zinc-200 pt-8 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            1. What ChromaBrew provides
          </h2>
          <p className="mt-2">
            ChromaBrew offers browser-based color tooling, published guides, and
            a website audit for public URLs. Tool outputs — palettes, tokens,
            themes, and generated code — are yours to use in personal and
            commercial projects without attribution. Brand reference colors are
            widely published values, not official brand guidelines: verify
            against the brand owner before shipping anything in their identity.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            2. Acceptable use
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Do not abuse, overload, or attempt to disrupt the tools, audit worker, or APIs.</li>
            <li>Only audit public URLs you are authorised to test. Do not submit pages behind a login or containing private data.</li>
            <li>Do not misrepresent tool outputs or audit reports as certifications of legal compliance.</li>
            <li>Do not scrape the site at a rate that degrades it for others.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            3. Accounts and sharing
          </h2>
          <p className="mt-2">
            Accounts are optional and exist to save projects and create share
            links. You are responsible for activity under your account and for
            keeping sign-in credentials secure. Public share links can be viewed
            by anyone with the URL — do not put secrets in saved projects.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            4. Audit reports are guidance, not legal advice
          </h2>
          <p className="mt-2">
            Audit findings, contrast measurements, and fix suggestions are
            automated guidance to help you improve accessibility and page
            quality. They are not a guarantee of WCAG conformance or of
            compliance with any law. Manual testing with assistive technology
            and qualified review remain necessary for conformance claims.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            5. Advertising
          </h2>
          <p className="mt-2">
            The site displays a small number of third-party ads (Google
            AdSense) as disclosed in the{" "}
            <Link href="/privacy" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              privacy policy
            </Link>
            . Ad content is the advertiser&apos;s responsibility.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            6. Availability and liability
          </h2>
          <p className="mt-2">
            The site is provided &quot;as is&quot; without warranties of any
            kind. To the maximum extent permitted by law, ChromaBrew is not
            liable for indirect, incidental, or consequential damages arising
            from use of the tools, guides, or audit reports. We may change,
            rate-limit, or discontinue features to keep the service sustainable.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            7. Contact
          </h2>
          <p className="mt-2">
            Questions about these terms:{" "}
            <a href="mailto:hello@chromabrew.com" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              hello@chromabrew.com
            </a>{" "}
            — or via the{" "}
            <Link href="/contact" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

export const dynamic = "force-static";
