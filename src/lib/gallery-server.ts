import { prisma } from "@/lib/db";
import {
  compareCommunityEntries,
  qualifyCommunityEntry,
  type QualifiedCommunityEntry,
} from "@/lib/gallery";

/**
 * The community catalog, loaded one way everywhere: newest opted-in public
 * projects with their vote counts, qualified through the shared contrast
 * gate, curated strongest-and-most-loved first. The gallery grid, the entry
 * pages' sibling lists, and the sitemap all read through here, so the three
 * can never disagree about membership or order.
 */
export async function fetchCommunityEntries(take: number): Promise<QualifiedCommunityEntry[]> {
  const projects = await prisma.project.findMany({
    where: { visibility: "public", listedInGallery: true },
    select: {
      id: true,
      name: true,
      config: true,
      updatedAt: true,
      user: { select: { name: true } },
      _count: { select: { votes: true } },
    },
    orderBy: { updatedAt: "desc" },
    take,
  });
  const qualified: QualifiedCommunityEntry[] = [];
  for (const project of projects) {
    const entry = qualifyCommunityEntry({
      id: project.id,
      name: project.name,
      config: project.config,
      updatedAt: project.updatedAt,
      author: project.user.name ?? "Anonymous",
      votes: project._count.votes,
    });
    if (entry) qualified.push(entry);
  }
  return qualified.sort(compareCommunityEntries);
}

/**
 * Which of the given entries the holder of `voterKey` already up-voted — the
 * initial pressed state for vote buttons. Null key means an unknown visitor:
 * no state, not an error.
 */
export async function fetchVotedIds(
  projectIds: string[],
  voterKey: string | null,
): Promise<Set<string>> {
  if (!voterKey || projectIds.length === 0) return new Set();
  const rows = await prisma.projectVote.findMany({
    where: { projectId: { in: projectIds }, voterKey },
    select: { projectId: true },
  });
  return new Set(rows.map((row) => row.projectId));
}
