import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { qualifyCommunityEntry, voterKeyFor } from "@/lib/gallery";
import { fetchCommunityEntries, fetchVotedIds } from "@/lib/gallery-server";
import { clientIpFromHeaders, hashIp } from "@/lib/audit/rate-limit";
import { paletteGeneratorHref } from "@/lib/palettes";
import { PaletteSwatches } from "@/components/palettes/palette-card";
import { VoteButton } from "@/components/gallery/vote-button";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";
import { clampDescription } from "@/lib/meta";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * One community palette's page: public, opted-in, and gate-qualified.
 *
 * Entry pages are indexable (the gallery index itself stays noindex — it is
 * a listing, not content). The same `qualifyCommunityEntry` gate decides the
 * page, the gallery grid, and the sitemap, so the three can never disagree.
 */
async function loadEntry(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      config: true,
      updatedAt: true,
      visibility: true,
      listedInGallery: true,
      user: { select: { name: true } },
      _count: { select: { votes: true } },
    },
  });
  if (!project || project.visibility !== "public" || !project.listedInGallery) {
    return null;
  }
  return qualifyCommunityEntry({
    id: project.id,
    name: project.name,
    config: project.config,
    updatedAt: project.updatedAt,
    author: project.user.name ?? "Anonymous",
    votes: project._count.votes,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entry = await loadEntry(id);
  if (!entry) return {};
  const description = `${entry.name} by ${entry.author}: ${entry.colors.join(", ")} — a community palette shared from the ChromaBrew generator.`;
  return {
    title: `${entry.name} · Community Palette`,
    description: clampDescription(description),
    alternates: { canonical: `/gallery/${entry.id}` },
    openGraph: {
      title: `${entry.name} · Community Palette`,
      description,
      url: `/gallery/${entry.id}`,
      type: "article",
    },
  };
}

export default async function CommunityEntryPage({ params }: Props) {
  const { id } = await params;
  const entry = await loadEntry(id);
  if (!entry) notFound();

  // Sibling entries keep the catalog crawlable: without them an entry page
  // links only to the (noindex) gallery index, and crawlers landing here
  // hit a dead end. Same harmony first, then the catalog's curation order.
  const siblings = (await fetchCommunityEntries(200))
    .filter((other) => other.id !== entry.id)
    .sort(
      (a, b) =>
        Number(b.strategy === entry.strategy) - Number(a.strategy === entry.strategy) ||
        b.votes - a.votes ||
        b.anchorRatio - a.anchorRatio,
    )
    .slice(0, 6);

  const session = await auth().catch(() => null);
  const headerList = await headers();
  const voterKey = voterKeyFor({
    userId: session?.user?.id ?? null,
    ipHash: hashIp(clientIpFromHeaders(headerList)),
  });
  const votedIds = await fetchVotedIds([entry.id], voterKey);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          headline: `${entry.name} — community color palette`,
          author: { "@type": "Person", name: entry.author },
          mainEntityOfPage: `${siteUrl}/gallery/${entry.id}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Community gallery", item: `${siteUrl}/gallery` },
            { "@type": "ListItem", position: 3, name: entry.name, item: `${siteUrl}/gallery/${entry.id}` },
          ],
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <Link href="/gallery" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Community gallery
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">{entry.name}</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Community palette · by {entry.author}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {entry.name}
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Shared from the ChromaBrew generator
          {entry.strategy ? ` (built with the ${entry.strategy} strategy)` : ""}. The
          darkest and lightest stops measure {entry.anchorRatio.toFixed(1)}:1, clearing
          the gallery&apos;s contrast gate.
        </p>
      </header>

      <div className="mt-8">
        <PaletteSwatches
          palette={{
            slug: entry.id,
            theme: "community",
            name: entry.name,
            colors: entry.colors,
            description: "",
            tags: [],
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <VoteButton
          projectId={entry.id}
          initialVotes={entry.votes}
          initialVoted={votedIds.has(entry.id)}
        />
        <Link
          href={paletteGeneratorHref({
            slug: entry.id,
            theme: "community",
            name: entry.name,
            colors: entry.colors,
            description: "",
            tags: [],
          })}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Open in generator
        </Link>
        <Link
          href="/gallery"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          More community palettes
        </Link>
      </div>

      {siblings.length > 0 ? (
        <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            More community palettes
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {siblings.map((sibling) => (
              <li key={sibling.id}>
                <Link
                  href={`/gallery/${sibling.id}`}
                  className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <span className="flex h-16" aria-hidden="true">
                    {sibling.colors.map((hex) => (
                      <span
                        key={hex}
                        className="h-full flex-1"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                  <span className="block px-4 py-3">
                    <span className="block truncate text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                      {sibling.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      by {sibling.author}
                      {sibling.votes > 0
                        ? ` · ${sibling.votes} ${sibling.votes === 1 ? "up-vote" : "up-votes"}`
                        : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
