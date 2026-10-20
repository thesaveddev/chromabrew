import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
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
      user: { select: { name: true, image: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Private projects: only the owner can view
  if (project.visibility === "private" && project.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project);
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

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, visibility, config, listedInGallery } = body as {
    name?: string;
    description?: string;
    visibility?: "private" | "public";
    config?: Record<string, unknown>;
    listedInGallery?: boolean;
  };

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

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
