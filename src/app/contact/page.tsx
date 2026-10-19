import type { Metadata } from "next";
import Link from "next/link";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ChromaBrew: report a tool bug, request a correction, or ask about the free color tools and website audit.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact ChromaBrew",
    description:
      "Report a bug, request a correction, or ask about the free color tools and website audit.",
    url: "/contact",
    type: "website",
    images: [defaultOgImage],
  },
};

/** The public inbox. Keep it as a mailto so there is one real human route. */
const CONTACT_EMAIL = "hello@chromabrew.com";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Contact</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Contact
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Talk to a human.
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Bug reports, guide corrections, accessibility questions, and privacy
          requests all go to the same inbox and are read by the person who
          builds ChromaBrew. Most messages get a reply within a few working
          days.
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Email
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          The fastest route for anything, including privacy and ad-related
          questions:
        </p>
        <p className="mt-2">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-base font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>

      <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          What to include
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">Tool bugs:</strong>{" "}
            the page URL, the exact input values or color, what you expected,
            and what happened instead.
          </li>
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">Audit issues:</strong>{" "}
            the scanned URL, the scan date, and whether the page is behind a
            login or bot protection.
          </li>
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">Guide corrections:</strong>{" "}
            the article URL and the sentence or code block that needs fixing.
          </li>
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">Privacy requests:</strong>{" "}
            say whether you want a copy, correction, or deletion of data tied
            to your account — see the{" "}
            <Link href="/privacy" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              privacy policy
            </Link>{" "}
            for what is stored.
          </li>
        </ul>
      </section>

      <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Response times
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Tool and audit bugs that affect results are triaged first, then guide
          corrections, then everything else. Privacy requests are handled under
          the timelines described in the privacy policy. There is no phone
          support and no separate press inbox — email keeps every request in
          one accountable queue.
        </p>
      </section>
    </div>
  );
}

export const dynamic = "force-static";
