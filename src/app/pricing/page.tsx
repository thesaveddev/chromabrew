import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/entitlements";
import { siteUrl } from "@/lib/site-url";
import { defaultOgImage } from "@/lib/og";
import { UpgradeButton } from "@/components/billing/upgrade-button";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ChromaBrew is free for individual developers. Full design system generator, all color controls, WCAG checks, and core exports — forever. Pro adds unlimited saving, every export and AI.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    url: `${siteUrl}/pricing`,
    images: [defaultOgImage],
  },
};

const PRIMARY_BUTTON =
  "block w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const SECONDARY_BUTTON =
  "block w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Pricing
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          Free forever. Pro when you need it.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          The full design system generator, all color controls, WCAG
          accessibility checks, and core exports — completely free, no account
          required. Pro unlocks unlimited saving, every export adapter and AI.
        </p>
      </div>

      <div className="mt-14 grid max-w-3xl gap-6 mx-auto md:grid-cols-2">
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
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/design-system"
            className={`${PRIMARY_BUTTON} mt-8 block`}
          >
            Get started
          </Link>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border border-zinc-900 bg-white p-8 dark:border-zinc-400 dark:bg-zinc-900">
          <span className="absolute -top-3 left-6 rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            Pro + AI
          </span>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {PLANS.pro.name}
          </h2>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {PLANS.pro.price}
            <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
              /{PLANS.pro.period}
            </span>
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            or {PLANS.pro.annualPrice}/{PLANS.pro.annualPeriod} —{" "}
            {PLANS.pro.annualNote}
          </p>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {PLANS.pro.description}
          </p>
          <ul className="mt-6 space-y-3">
            {PLANS.pro.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 space-y-2">
            <UpgradeButton interval="month" className={PRIMARY_BUTTON}>
              Upgrade — {PLANS.pro.price}/{PLANS.pro.period}
            </UpgradeButton>
            <UpgradeButton interval="year" className={SECONDARY_BUTTON}>
              Pay yearly — {PLANS.pro.annualPrice}/{PLANS.pro.annualPeriod}
            </UpgradeButton>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Secure checkout by Polar. Cancel anytime from your account.
          </p>
        </div>
      </div>

      <section className="mt-20">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          FAQ
        </p>
        <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Frequently asked questions
        </h2>
        <div className="mx-auto mt-8 max-w-3xl space-y-3">
          {[
            {
              q: "Is it really free?",
              a: "Yes. The full design system generator, all color controls, WCAG accessibility checks, and core exports (CSS, JSON, Tailwind, shadcn/ui, Figma) are free forever with no account required.",
            },
            {
              q: "Do I need an account to use the generator?",
              a: "No. The generator runs entirely in your browser. An account is only needed if you want to save projects.",
            },
            {
              q: "Can I export to frameworks like Tailwind and shadcn/ui?",
              a: "Yes. CSS variables, JSON (DTCG), Tailwind CSS v4, shadcn/ui themes, and Figma Tokens Studio exports are all included for free — plus a free Figma plugin that creates native Figma variables.",
            },
            {
              q: "What do I get with Pro?",
              a: "Unlimited project saving and palette history, every remaining export adapter (Bootstrap, MUI, Ant Design, Chakra, W3C, Penpot, Flutter, iOS, Android, ZIP bundle), version history, team sharing, emailed site reports for watched sites, and AI features as they ship — on top of everything free.",
            },
            {
              q: "How does team sharing work?",
              a: "On any project, open the Team tab and invite collaborators by email — viewers can open and inspect the project, editors can also save changes and manage versions. Invitees need a ChromaBrew account, and only the project owner can invite, change roles, or remove people.",
            },
            {
              q: "Monthly or annual?",
              a: "Both exist: $9/month or $90/year (2 months free). The features are identical; annual just costs less.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from your account's billing portal — you keep Pro until the end of the period you already paid for.",
            },
            {
              q: "Is my data stored anywhere?",
              a: "The generator runs in your browser and nothing is sent to a server unless you save a project. Saved projects are stored in your account.",
            },
          ].map((faq, index) => (
            <details
              key={faq.q}
              open={index === 0}
              className="group rounded-2xl border border-zinc-200 bg-white transition-colors open:border-zinc-300 open:shadow-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:open:border-zinc-700 dark:hover:border-zinc-700"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium text-zinc-900 marker:hidden dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-transform duration-200 group-open:rotate-45 group-open:bg-zinc-900 group-open:text-white dark:bg-zinc-800 dark:text-zinc-400 dark:group-open:bg-zinc-100 dark:group-open:text-zinc-900"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
