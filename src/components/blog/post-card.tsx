import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/posts";

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block h-full rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
    >
      {post.image && (
        <img
          src={post.image}
          alt={post.imageAlt ?? ""}
          className="mb-3 h-28 w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
        />
      )}
      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
        <span className="font-medium uppercase tracking-wider text-zinc-500">{post.category}</span>
        <span aria-hidden>·</span>
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      </div>
      <h2 className="mt-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:underline group-hover:underline-offset-4 dark:text-zinc-100">
        {post.title}
      </h2>
      <p className="mt-1.5 text-xs leading-5 text-zinc-500">{post.excerpt}</p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
