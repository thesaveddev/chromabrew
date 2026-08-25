import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/entitlements";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ChromaBrew is free for individual developers. Pro adds unlimited projects, all export adapters, and team features.",
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
          Start free. Upgrade when you need to.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          The full generator and core exports are free forever. Pro unlocks
          unlimited saving, every export format, and team features.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {/* Free */}
        <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
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
            className="mt-8 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Get started
          </Link>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border-2 border-zinc-900 bg-white p-8 dark:border-zinc-100 dark:bg-zinc-900">
          <span className="absolute -top-3 left-6 rounded-full bg-zinc-900 px-3 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            Coming soon
          </span>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {PLANS.pro.name}
          </h2>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {PLANS.pro.price}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            per {PLANS.pro.period}
          </p>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {PLANS.pro.description}
          </p>
          <ul className="mt-6 space-y-3">
            {PLANS.pro.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-zinc-900 dark:text-zinc-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled
            className="mt-8 block w-full cursor-not-allowed rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Coming soon
          </button>
        </div>
      </div>

      {/* FAQ */}
      <section className="mt-20">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Frequently asked questions
        </h2>
        <dl className="mt-6 space-y-6">
          {[
            {
              q: "Is the free plan really free?",
              a: "Yes. The full design system generator, all color controls, WCAG checks, and core exports (CSS, JSON, Tailwind, shadcn/ui) are free forever with no account required.",
            },
            {
              q: "What do I get with Pro?",
              a: "Unlimited project saving, all 13 export adapters (Figma, Flutter, iOS, Android, MUI, Ant Design, Chakra, Bootstrap), unlimited palette history, team sharing, and priority support.",
            },
            {
              q: "When will Pro be available?",
              a: "We are finishing the core product first. Pro will launch with Stripe billing. You can use everything in the free plan today.",
            },
            {
              q: "Do I need an account to use the generator?",
              a: "No. The generator runs entirely in your browser. An account is only needed if you want to save projects.",
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
