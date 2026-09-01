import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findPost, formatPostDate, getRelatedTools, allPostSlugs } from "@/lib/posts-server";
import { siteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/site/json-ld";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPostSlugs().map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    ...(post.image
      ? { openGraph: { images: [{ url: `${siteUrl}${post.image}`, width: 1200, height: 630, alt: post.imageAlt ?? post.title }] } }
      : {}),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const related = getRelatedTools(post.relatedHrefs);
  const url = `${siteUrl}/blog/${post.slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt,
          ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
          author: { "@type": "Organization", name: "ChromaBrew", url: siteUrl },
          publisher: { "@type": "Organization", name: "ChromaBrew", url: siteUrl },
          mainEntityOfPage: url,
          ...(post.image ? { image: [`${siteUrl}${post.image}`] } : {}),
        }}
      />
      {post.sections.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.sections.map((s) => ({
              "@type": "Question",
              name: s.heading,
              acceptedAnswer: { "@type": "Answer", text: s.body.join(" ") },
            })),
          }}
        />
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        }}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/blog" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">Blog</Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">{post.title}</span>
      </nav>

      <header className="mt-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-medium uppercase tracking-wider text-zinc-500">{post.category}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
        </div>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
          {post.title}
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">{post.description}</p>
      </header>

      {post.image && (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <img
            src={post.image}
            alt={post.imageAlt ?? post.title}
            className="h-auto w-full"
            width={1200}
            height={630}
          />
        </div>
      )}

      <div className="prose dark:prose-invert mt-8 max-w-none">
        {post.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{section.heading}</h2>
            {section.image && (
              <img
                src={section.image}
                alt={section.imageAlt ?? ""}
                className="mt-3 h-auto w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
              />
            )}
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {section.bullets.map((item) =>
                  typeof item === "string" ? (
                    <li key={item} className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {item}
                    </li>
                  ) : (
                    <li key={item.href} className="text-sm leading-6">
                      <Link
                        href={item.href}
                        className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                      >
                        {item.label} →
                      </Link>
                    </li>
                  )
                )}
              </ul>
            )}
            {section.code && (
              <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-4 text-xs leading-6 text-zinc-100 dark:border-zinc-700">
                <code>{section.code}</code>
              </pre>
            )}
            {section.links && (
              <div className="mt-4 flex flex-wrap gap-2">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    {link.label} →
                  </Link>
                ))}
              </div>
            )}
            {section.tip && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tip</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{section.tip}</p>
              </div>
            )}
          </section>
        ))}
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Related free tools</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="group block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <h3 className="text-sm font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-4 dark:text-zinc-100">
                    {tool.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">{tool.blurb}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Want to apply this right now?{" "}
          <Link href="/design-system" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
            Open the color palette generator
          </Link>{" "}
          and try it with your own brand color — free, no sign-up.
        </p>
      </div>
    </article>
  );
}
