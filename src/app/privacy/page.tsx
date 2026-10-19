import type { Metadata } from "next";
import Link from "next/link";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ChromaBrew handles your data: browser-local color processing, accounts, analytics, cookies, and Google AdSense advertising.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy · ChromaBrew",
    description:
      "Browser-local processing, minimal account data, cookies and Google AdSense disclosure.",
    url: "/privacy",
    type: "website",
    images: [defaultOgImage],
  },
};

const EFFECTIVE_DATE = "October 19, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Privacy Policy</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Privacy Policy
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Your colors stay yours.
        </h1>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Effective date: {EFFECTIVE_DATE}
        </p>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          ChromaBrew is designed to need as little of your data as possible.
          The color tools and contrast checks run entirely in your browser —
          your palettes, images, and input values are never uploaded. This
          policy explains the limited cases where data does leave your device:
          accounts, the website audit, analytics, and advertising.
        </p>
      </header>

      <div className="mt-8 space-y-8 border-t border-zinc-200 pt-8 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            1. What runs locally and is never collected
          </h2>
          <p className="mt-2">
            Palette generation, color conversion, shade scales, contrast checks,
            image color extraction, token generation, and code exports execute
            as client-side computation. Inputs you type or images you open in
            these tools are processed on your device and are not sent to
            ChromaBrew servers, not stored, and not shared with advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            2. Accounts and saved projects
          </h2>
          <p className="mt-2">
            Creating an account (via GitHub or Google sign-in) is optional and
            exists only to save projects and share links. When you do, we store
            your name, email address, and the projects you explicitly save. We
            never sell this data, never share it with advertisers, and use it
            only to operate your account. You can request a copy, correction,
            or deletion at any time via{" "}
            <a href="mailto:hello@chromabrew.com" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              hello@chromabrew.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            3. Website audit scans
          </h2>
          <p className="mt-2">
            When you submit a URL to the audit tool, our worker fetches that
            public page, renders it, captures a screenshot, and analyses its
            contrast, accessibility findings, and metadata. Scan inputs, results,
            and screenshots are retained so your report link keeps working, and
            are subject to automatic retention limits. Do not submit pages that
            require a login or contain private information — only scan public
            URLs you are authorised to test.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            4. Cookies and advertising (Google AdSense)
          </h2>
          <p className="mt-2">
            ChromaBrew displays a small number of clearly labeled ads served by
            Google AdSense. Google may use cookies, including the DoubleClick
            cookie, to serve and measure ads, including interest-based ads.
            Google&apos;s use of advertising cookies enables it and its partners
            to serve ads based on your visits to this and other sites. You can
            opt out of personalised advertising at Google&apos;s{" "}
            <a
              href="https://www.google.com/settings/ads"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
            >
              Ads Settings
            </a>
            , and learn how Google uses data from sites like this at{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
            >
              How Google uses information from sites that use its services
            </a>
            .
          </p>
          <p className="mt-2">
            Ads never change tool results, audit findings, or guide content, and
            ChromaBrew does not share your account data or tool inputs with
            Google for advertising. Theme preference is stored locally in your
            browser (localStorage) and is not a tracking cookie.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            5. Analytics
          </h2>
          <p className="mt-2">
            The site uses privacy-conscious deployment analytics (Vercel
            Analytics) to understand aggregate usage such as page views. No
            advertising identifiers are set by ChromaBrew itself, and analytics
            data is never joined with account data for ad targeting.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            6. Your rights and contact
          </h2>
          <p className="mt-2">
            Depending on where you live you may have rights to access, correct,
            delete, or port personal data tied to your account, and to object
            to or restrict certain processing. To exercise any of these, email{" "}
            <a href="mailto:hello@chromabrew.com" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              hello@chromabrew.com
            </a>{" "}
            from the address tied to your account. Security-related questions
            can also go there — or start at the{" "}
            <Link href="/contact" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              contact page
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            7. Changes to this policy
          </h2>
          <p className="mt-2">
            Material changes will update the effective date above. Continued
            use of the site after a change means you accept the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}

export const dynamic = "force-static";
