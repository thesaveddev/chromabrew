import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/entitlements";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ChromaBrew is free for individual developers. Full design system generator, all color controls, WCAG checks, and core exports — forever.",
  alternates: { canonical: "/pricing" },
  openGraph: { url: `${siteUrl}/pricing` },
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Pricing
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          Free forever. No catch.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          The full design system generator, all color controls, WCAG
          accessibility checks, and core exports — completely free, no account
          required.
        </p>
      </div>

      <div className="mt-14 flex justify-center">
        <div className="relative max-w-md rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {PLANS.free.name}
          </h2>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {PLANS.free.price}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {PLANS.free.period}
          </p>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {PLANS.free.description}
          </p>
          <ul className="mt-6 space-y-3">
            {PLANS.free.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/design-system"
            className="mt-8 block w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Get started
          </Link>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Frequently asked questions
        </h2>
        <dl className="mt-6 space-y-6">
          {[
            {
              q: "Is it really free?",
              a: "Yes. The full design system generator, all color controls, WCAG checks, and core exports (CSS, JSON, Tailwind, shadcn/ui) are free forever with no account required.",
            },
            {
              q: "Do I need an account to use the generator?",
              a: "No. The generator runs entirely in your browser. An account is only needed if you want to save projects.",
            },
            {
              q: "Can I export to frameworks like Tailwind and shadcn/ui?",
              a: "Yes. CSS variables, JSON (DTCG), Tailwind CSS v4, and shadcn/ui theme exports are all included for free.",
            },
            {
              q: "Is my data stored anywhere?",
              a: "The generator runs in your browser and nothing is sent to a server unless you save a project. Saved projects are stored in your account.",
            },
          ].map((faq) => (
            <div key={faq.q}>
              <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {faq.q}
              </dt>
              <dd className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
