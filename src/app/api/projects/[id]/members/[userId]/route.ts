import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import {
  canManageProject,
  resolveProjectAccess,
  type ProjectMemberRole,
} from "@/lib/projects/access";
import { NextResponse } from "next/server";

// DELETE /api/projects/[id]/members/[userId] — remove a collaborator, or leave.
// The owner removes anyone (except themselves — ownership is not something
// you resign by API call; delete the project or keep it). A member removes
// only themselves, which is how leaving works. Nobody else may touch the
// roster, and strangers cannot probe it: without access this is a 404.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id, userId: targetUserId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = resolveProjectAccess({
    ownerId: project.userId,
    userId: session.user.id,
    memberRole: (project.members[0]?.role ?? null) as ProjectMemberRole | null,
  });

  const leaving = targetUserId === session.user.id;
  if (!leaving && !canManageProject(access)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!leaving && access === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (leaving && access === "owner") {
    return NextResponse.json(
      { error: "Owners can't leave their own project — delete it instead." },
      { status: 400 },
    );
  }
  if (leaving && access === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.projectMember.deleteMany({
    where: { projectId: id, userId: targetUserId },
  });
  return NextResponse.json({ ok: true });
}
