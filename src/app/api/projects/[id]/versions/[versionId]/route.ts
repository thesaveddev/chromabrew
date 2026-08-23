import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

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

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
