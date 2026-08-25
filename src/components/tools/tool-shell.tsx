import Link from "next/link";
import { TOOLS, type ToolDefinition } from "@/lib/tools";
import { siteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/site/json-ld";

/** Deterministic "related tools" mapping (next three tools cyclically). */
const RELATED = new Map<string, ToolDefinition[]>(
  TOOLS.map((tool, index) => [
    tool.href,
    [1, 2, 3].map((offset) => TOOLS[(index + offset) % TOOLS.length]),
  ]),
);

/**
 * Shared shell for free tool pages: unique heading, working tool, honest
 * explanatory copy, FAQ and structured data for rich results.
 */
export function ToolShell({
  tool,
  children,
  usage,
}: {
  tool: ToolDefinition;
  children: React.ReactNode;
  usage: string[];
}) {
  const others = RELATED.get(tool.href) ?? [];
  const anchor = tool.href.replace(/\//g, "-");
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: tool.title,
          url: `${siteUrl}${tool.href}`,
          description: tool.description,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any (web browser)",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Tools", item: `${siteUrl}/tools` },
            { "@type": "ListItem", position: 3, name: tool.title, item: `${siteUrl}${tool.href}` },
          ],
        }}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/tools" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">Tools</Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">{tool.title}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {tool.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {tool.description}
        </p>
      </header>

      <div className="mt-8">{children}</div>

      {usage.length ? (
        <section aria-labelledby={`how-${anchor}`} className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 id={`how-${anchor}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            How to use this tool
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {usage.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {tool.faqs.length ? (
        <section aria-labelledby={`faq-${anchor}`} className="mt-10">
          <h2 id={`faq-${anchor}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Frequently asked questions
          </h2>
          <dl className="mt-4 space-y-5">
            {tool.faqs.map((faq) => (
              <div key={faq.q}>
                <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{faq.q}</dt>
                <dd className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {others.length ? (
        <section aria-labelledby="related-tools" className="mt-10">
          <h2 id="related-tools" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Related tools
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((other) => (
              <li key={other.href}>
                <Link
                  href={other.href}
                  className="inline-block rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
                >
                  {other.navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
