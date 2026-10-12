import type { Metadata } from "next";
import { UrlForm } from "@/components/audit/url-form";

export const metadata: Metadata = {
  // Bare title: the root layout's template appends " · ChromaBrew". Spelling the
  // brand here as well rendered it twice and in the wrong casing ("Chromabrew").
  title: "Website Audit — accessibility & design scanner",
  description: "Analyze your website for design, accessibility, and visual consistency issues.",
  // Without this the page inherits the layout's canonical ("/") and tells search
  // engines it is a duplicate of the home page, which no sitemap entry can undo.
  alternates: { canonical: "/audit" },
  robots: { index: true },
};

export default function AuditPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
            Website Audit
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Enter your website URL to analyze design, accessibility, and visual consistency
          </p>
        </div>
        <div className="mt-10">
          <UrlForm />
        </div>
      </div>
    </div>
  );
}
