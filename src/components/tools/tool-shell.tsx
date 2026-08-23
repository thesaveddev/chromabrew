import Link from "next/link";
import { TOOLS, type ToolDefinition } from "@/lib/tools";

/** Deterministic "related tools" mapping (next three tools cyclically). */
const RELATED = new Map<string, ToolDefinition[]>(
  TOOLS.map((tool, index) => [
    tool.href,
    [1, 2, 3].map((offset) => TOOLS[(index + offset) % TOOLS.length]),
  ]),
);

/**
 * Shared shell for free tool pages: unique heading, working tool, honest
 * explanatory copy and internal links to related tools.
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
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
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
        <section aria-labelledby={`how-${tool.href.replace(/\//g, "-")}`} className="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <h2 id={`how-${tool.href.replace(/\//g, "-")}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            How to use this tool
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {usage.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
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
                  className="inline-block rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
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
