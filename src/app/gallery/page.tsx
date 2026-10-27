import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import {
  galleryStrategy,
  parseGalleryConfig,
  projectPalette,
  type CommunityEntry,
} from "@/lib/gallery";
import { CommunityExplorer } from "@/components/gallery/community-explorer";

export const metadata: Metadata = {
  title: "Community gallery · ChromaBrew",
  description:
    "Design systems shared by the ChromaBrew community. Browse public palettes — listing is opt-in and the gallery stays out of search results for now.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const projects = await prisma.project.findMany({
    where: { visibility: "public", listedInGallery: true },
    select: {
      id: true,
      name: true,
      config: true,
      updatedAt: true,
      user: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });

  const entries: CommunityEntry[] = projects.flatMap((project) => {
    const config = parseGalleryConfig(project.config);
    if (!config) return [];
    const colors = projectPalette(config);
    if (!colors) return [];
    return [
      {
        id: project.id,
        name: project.name,
        author: project.user.name ?? "Anonymous",
        colors,
        strategy: galleryStrategy(config),
        updatedAt: project.updatedAt.toISOString(),
      },
    ];
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Community
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Community gallery
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Public design systems whose owners opted in. Unlisted projects never
          appear here — opt in from any public project&apos;s settings. Newest
          updates first.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No community palettes yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Be the first: open one of your public projects, check
            &ldquo;List in the community gallery&rdquo; in settings, and it will
            show up here.
          </p>
          <Link
            href="/design-system"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Open the generator
          </Link>
        </div>
      ) : (
        <CommunityExplorer entries={entries} />
      )}
    </div>
  );
}
