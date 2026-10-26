import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import {
  canEditProject,
  resolveProjectAccess,
  type ProjectMemberRole,
} from "@/lib/projects/access";
import type { Prisma } from "@prisma/client";

/** Owners and editors; everyone else gets a 404 (private) or 403 (public). */
async function editAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { where: { userId }, select: { role: true } } },
  });
  if (!project) return { project: null, ok: false, status: 404 } as const;
  const access = resolveProjectAccess({
    ownerId: project.userId,
    userId,
    memberRole: (project.members[0]?.role ?? null) as ProjectMemberRole | null,
  });
  if (!canEditProject(access)) {
    return {
      project,
      ok: false,
      status: project.visibility === "private" ? 404 : 403,
    } as const;
  }
  return { project, ok: true as const, status: 200 as const };
}

// PATCH /api/projects/[id]/versions/[versionId] — restore a version
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gate = await editAccess(id, session.user.id);
  if (!gate.ok || !gate.project) {
    return NextResponse.json(
      { error: gate.status === 404 ? "Not found" : "Only collaborators with editor access can restore versions." },
      { status: gate.status },
    );
  }
  const project = gate.project;

  const version = await prisma.projectVersion.findUnique({
    where: { id: versionId },
  });
  if (!version || version.projectId !== id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Save current config as a new version before restoring
  await prisma.projectVersion.create({
    data: {
      label: "Before restore",
      config: project.config as Prisma.InputJsonValue,
      projectId: id,
    },
  });

  // Restore the version's config into the project
  const updated = await prisma.project.update({
    where: { id },
    data: { config: version.config as Prisma.InputJsonValue },
  });

  return NextResponse.json(updated);
}

// DELETE /api/projects/[id]/versions/[versionId] — delete a version
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gate = await editAccess(id, session.user.id);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 404 ? "Not found" : "Only collaborators with editor access can delete versions." },
      { status: gate.status },
    );
  }

  const version = await prisma.projectVersion.findUnique({
    where: { id: versionId },
  });
  if (!version || version.projectId !== id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  await prisma.projectVersion.delete({ where: { id: versionId } });
  return NextResponse.json({ ok: true });
}
