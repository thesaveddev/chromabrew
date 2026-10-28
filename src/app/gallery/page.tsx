import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { voterKeyFor } from "@/lib/gallery";
import { fetchCommunityEntries, fetchVotedIds } from "@/lib/gallery-server";
import { clientIpFromHeaders, hashIp } from "@/lib/audit/rate-limit";
import { CommunityExplorer } from "@/components/gallery/community-explorer";

export const metadata: Metadata = {
  // Bare title: the root layout's template appends " · ChromaBrew" — the old
  // value spelled the brand here too and rendered it twice.
  title: "Community gallery",
  description:
    "Design systems shared by the ChromaBrew community. Browse public palettes — listing is opt-in and the gallery stays out of search results for now.",
  // Without this the page inherits the layout's canonical ("/") and tells
  // search engines it is a duplicate of the home page.
  alternates: { canonical: "/gallery" },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  // Curation, not recency: the contrast gate decides membership and
  // up-votes plus the anchor ratio decide order, so the community's
  // strongest and most-loved work surfaces.
  const entries = await fetchCommunityEntries(200);

  // Whose votes these are, so buttons render pressed correctly on first
  // paint: the signed-in user when there is one, else the hashed IP.
  const session = await auth().catch(() => null);
  const headerList = await headers();
  const voterKey = voterKeyFor({
    userId: session?.user?.id ?? null,
    ipHash: hashIp(clientIpFromHeaders(headerList)),
  });
  const votedIds = await fetchVotedIds(
    entries.map((entry) => entry.id),
    voterKey,
  );

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
          appear here — opt in from any public project&apos;s settings. Only
          palettes whose darkest and lightest stops clear the contrast gate
          are listed, most up-voted first, each with its own page.
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
        <CommunityExplorer entries={entries} votedIds={[...votedIds]} />
      )}
    </div>
  );
}
