import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { hasEntitlement } from "@/lib/entitlements-server";
import {
  canManageProject,
  canViewProject,
  resolveProjectAccess,
  type ProjectMemberRole,
} from "@/lib/projects/access";
import { NextResponse } from "next/server";

async function accessFor(projectId: string, userId: string | null | undefined) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      userId: true,
      visibility: true,
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

// GET /api/projects/[id]/members — owner + members see who has access.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  const { project, access } = await accessFor(id, session?.user?.id ?? null);
  if (!project || !canViewProject(project.visibility, access)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [owner, members] = await Promise.all([
    prisma.user.findUnique({
      where: { id: project.userId },
      select: { id: true, name: true, email: true },
    }),
    prisma.projectMember.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    owner,
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      createdAt: m.createdAt,
    })),
    isOwner: access === "owner",
  });
}

// POST /api/projects/[id]/members — owner invites by email with a role.
// Team sharing is the Pro collaboration surface: the owner's plan pays for
// it, so free owners get a refusal that names the upgrade instead of a
// silent 500 or a fake success.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { project, access } = await accessFor(id, session.user.id);
  if (!project || !canManageProject(access)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await hasEntitlement(project.userId, "pro"))) {
    return NextResponse.json(
      {
        code: "pro_required",
        error: "Team sharing is a Pro feature — upgrade to invite collaborators.",
      },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { email, role } = body as { email?: string; role?: string };
  if (role !== "viewer" && role !== "editor") {
    return NextResponse.json(
      { error: 'role must be "viewer" or "editor"' },
      { status: 400 },
    );
  }
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true },
  });
  if (!invitee) {
    // Access is granted to a user row, never to a bearer token, so there has
    // to be an account to grant it to. Say so plainly instead of 500ing.
    return NextResponse.json(
      {
        code: "no_account",
        error: "Nobody has a ChromaBrew account with that email yet — they'll need to sign up first.",
      },
      { status: 404 },
    );
  }
  if (invitee.id === project.userId) {
    return NextResponse.json(
      { error: "That person already owns this project." },
      { status: 400 },
    );
  }

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: id, userId: invitee.id } },
    update: { role },
    create: { projectId: id, userId: invitee.id, role },
    select: { role: true, createdAt: true },
  });

  return NextResponse.json(
    {
      userId: invitee.id,
      name: invitee.name,
      email: invitee.email,
      role: member.role,
      createdAt: member.createdAt,
    },
    { status: 201 },
  );
}
