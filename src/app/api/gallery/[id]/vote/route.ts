import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { voterKeyFor } from "@/lib/gallery";
import { clientIpFromHeaders, hashIp } from "@/lib/audit/rate-limit";

/**
 * Up-vote toggle for one community gallery entry.
 *
 * POST with no body: votes when the reader hasn't, un-votes when they have.
 * Identity is the signed-in user when there is one, else the salted IP hash
 * — voting needs no account while staying one-per-person. Only listed public
 * projects accept votes; anything else 404s so private work can never collect
 * a public count. The response carries the new total and the reader's state,
 * so the button updates without a second round trip.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Props): Promise<NextResponse> {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, visibility: true, listedInGallery: true },
  });
  if (!project || project.visibility !== "public" || !project.listedInGallery) {
    return NextResponse.json({ error: "That palette is not in the community gallery." }, { status: 404 });
  }

  const session = await auth().catch(() => null);
  const voterKey = voterKeyFor({
    userId: session?.user?.id ?? null,
    ipHash: hashIp(clientIpFromHeaders(request.headers)),
  });
  if (!voterKey) {
    return NextResponse.json(
      { error: "Your vote could not be counted — sign in and try again." },
      { status: 400 },
    );
  }

  const existing = await prisma.projectVote.findUnique({
    where: { projectId_voterKey: { projectId: id, voterKey } },
    select: { id: true },
  });
  if (existing) {
    await prisma.projectVote.delete({ where: { id: existing.id } });
  } else {
    await prisma.projectVote.create({ data: { projectId: id, voterKey } });
  }

  const votes = await prisma.projectVote.count({ where: { projectId: id } });
  return NextResponse.json({ votes, voted: !existing });
}
