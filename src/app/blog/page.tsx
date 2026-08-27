import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS, postsByCategory } from "@/lib/posts";
import { PostCard } from "@/components/blog/post-card";

export const metadata: Metadata = {
  title: "Blog — Color & Design System Guides",
  description:
    "Practical guides on building accessible color palettes, design tokens, Tailwind v4 themes, dark mode, and more — from the team behind ChromaBrew's free color tools.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const groups = postsByCategory();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Blog</span>
      </nav>
      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Color &amp; design system guides
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Practical, no-fluff writing on accessible color palettes, design tokens,
          Tailwind v4 themes and dark mode — every guide ties back to a free ChromaBrew tool so you can apply it immediately.
        </p>
      </header>

      {groups.map(({ category, posts }) => (
        <section key={category} className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            {category}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-12 text-sm text-zinc-500">
        {BLOG_POSTS.length} guides published. <Link href="/tools" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">Explore all free color tools →</Link>
      </p>
    </div>
  );
}
