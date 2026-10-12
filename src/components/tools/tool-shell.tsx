import Link from "next/link";
import { TOOLS, type ToolDefinition } from "@/lib/tools";
import { livePosts, type BlogPost } from "@/lib/posts";
import { siteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/site/json-ld";

/**
 * Related tools: same-category tools first (so a color tool links to other
 * color tools, not SVGs), then anything else to fill the row.
 */
function relatedTools(tool: ToolDefinition): ToolDefinition[] {
  const same = TOOLS.filter((t) => t.href !== tool.href && t.category === tool.category);
  const rest = TOOLS.filter((t) => t.href !== tool.href && t.category !== tool.category);
  return [...same, ...rest].slice(0, 6);
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric", year: "numeric" });

/** Guides that expressly link to this tool page. */
function relatedArticles(tool: ToolDefinition): BlogPost[] {
  return livePosts().filter((post) => post.relatedHrefs.includes(tool.href)).slice(0, 3);
}

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
  const others = relatedTools(tool);
  const articles = relatedArticles(tool);
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

      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
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
        {tool.intro.length ? (
          <div className="mt-4 max-w-2xl space-y-2">
            {tool.intro.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
      </header>

      <div className="mt-8">{children}</div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Want the full design system from a color?{" "}
          <Link href="/design-system" className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
            Open the color palette generator
          </Link>{" "}
          to create accessible palettes, semantic tokens, light and dark themes, and production-ready CSS — all from a single color.
        </p>
      </div>

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

      {articles.length ? (
        <section aria-labelledby="related-guides" className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 id="related-guides" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Related guides
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block h-full rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
                >
                  {/* zinc-400 on white measures 2.62:1 at 11px; the card is dark
                      in dark mode, where zinc-400 is the right shade. */}
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {post.category} · {DATE_FMT.format(new Date(`${post.publishedAt}T00:00:00Z`))}
                  </p>
                  <p className="mt-1.5 text-sm font-medium leading-5 text-zinc-800 group-hover:text-zinc-900 dark:text-zinc-200 dark:group-hover:text-zinc-100">
                    {post.title}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{post.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        {tool.title} runs entirely in your browser — nothing you enter is sent to a server.
      </p>
    </div>
  );
}
