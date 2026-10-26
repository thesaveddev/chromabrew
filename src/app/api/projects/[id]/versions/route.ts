import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import {
  canEditProject,
  canViewProject,
  resolveProjectAccess,
  type ProjectMemberRole,
} from "@/lib/projects/access";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        where: session?.user?.id ? { userId: session.user.id } : undefined,
        select: { role: true },
      },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const access = resolveProjectAccess({
    ownerId: project.userId,
    userId: session?.user?.id ?? null,
    memberRole: (project.members[0]?.role ?? null) as ProjectMemberRole | null,
  });
  if (!canViewProject(project.visibility, access)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = await prisma.projectVersion.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(versions);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Saving a version is collaborative work: owners and editors. Viewers get
  // a 404 on private projects (no probing) and a refusal on public ones.
  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: { where: { userId: session.user.id }, select: { role: true } } },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const access = resolveProjectAccess({
    ownerId: project.userId,
    userId: session.user.id,
    memberRole: (project.members[0]?.role ?? null) as ProjectMemberRole | null,
  });
  if (!canEditProject(access)) {
    return NextResponse.json(
      { error: project.visibility === "private" ? "Not found" : "Only collaborators with editor access can save versions." },
      { status: project.visibility === "private" ? 404 : 403 },
    );
  }

  const body = await request.json();
  const { label, config } = body as { label?: string; config: Record<string, unknown> };

  if (!config) {
    return NextResponse.json({ error: "config is required" }, { status: 400 });
  }

  const version = await prisma.projectVersion.create({
    data: {
      label: label ?? null,
      config: config as Prisma.InputJsonValue,
      projectId: id,
    },
  });

  return NextResponse.json(version, { status: 201 });
}
