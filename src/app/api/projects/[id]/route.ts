import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import {
  canEditProject,
  canManageProject,
  canViewProject,
  EDITOR_PATCH_FIELDS,
  resolveProjectAccess,
  type ProjectMemberRole,
} from "@/lib/projects/access";
import type { Prisma } from "@prisma/client";

/**
 * The project plus the caller's access level in one round trip: owners get
 * full control, editors save config, viewers read — and strangers get
 * nothing on a private project (a 404, not a refusal, so membership cannot
 * be probed).
 */
async function projectWithAccess(id: string, userId: string | null | undefined) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      members: {
        where: userId ? { userId } : undefined,
        select: { role: true },
      },
    },
  });
  if (!project) return { project: null, access: null } as const;
  const access = resolveProjectAccess({
    ownerId: project.userId,
    userId,
    memberRole: (project.members[0]?.role ?? null) as ProjectMemberRole | null,
  });
  return { project, access } as const;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  const { project, access } = await projectWithAccess(id, session?.user?.id ?? null);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Private projects: owner and members can view; strangers get a 404.
  if (!canViewProject(project.visibility, access)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { members: _members, ...rest } = project;
  void _members;
  return NextResponse.json({
    ...rest,
    access,
    isOwner: access === "owner",
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { project, access } = await projectWithAccess(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Editors collaborate on the design itself: config only. Everything else
  // — name, visibility, gallery listing — is the owner's to change, and an
  // editor who could flip a project public could publish someone else's work.
  if (!canEditProject(access)) {
    return NextResponse.json(
      { error: project.visibility === "private" ? "Not found" : "Only collaborators with editor access can change this project." },
      { status: project.visibility === "private" ? 404 : 403 },
    );
  }
  const managing = canManageProject(access);

  const body = await request.json();
  const { name, description, visibility, config, listedInGallery } = body as {
    name?: string;
    description?: string;
    visibility?: "private" | "public";
    config?: Record<string, unknown>;
    listedInGallery?: boolean;
  };

  // A non-owner editor sends config and nothing else: any other field in the
  // body is refused outright rather than silently dropped, so a client that
  // thinks it renamed the project finds out instead of believing it did.
  if (!managing) {
    const allowed = new Set<string>(EDITOR_PATCH_FIELDS);
    const extra = [name, description, visibility, listedInGallery].some(
      (value) => value !== undefined,
    );
    if (extra || Object.keys(body).some((key) => !allowed.has(key))) {
      return NextResponse.json(
        { error: "Editors can only update the design config." },
        { status: 403 },
      );
    }
  }

  // Gallery listing is an explicit step above public visibility: a project
  // shared by link must never appear in the gallery by accident, so listing
  // a private project is refused rather than silently publishing it.
  const nextVisibility = visibility ?? project.visibility;
  if (listedInGallery === true && nextVisibility !== "public") {
    return NextResponse.json(
      { error: "Make the project public before listing it in the gallery." },
      { status: 400 },
    );
  }
  // Unpublishing removes the gallery listing with it — a private project is
  // never listed, whatever the flag says.
  const nextListed = nextVisibility === "public" ? listedInGallery : false;

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(visibility !== undefined && { visibility }),
      ...(config !== undefined && { config: config as Prisma.InputJsonValue }),
      ...(nextListed !== undefined && { listedInGallery: nextListed }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Deletion is ownership: collaborators lose access when the project goes,
  // but they can never make it go.
  const { project, access } = await projectWithAccess(id, session.user.id);
  if (!project || !canManageProject(access)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
