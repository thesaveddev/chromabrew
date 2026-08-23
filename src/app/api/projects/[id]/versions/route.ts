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

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.visibility === "private" && project.userId !== session?.user?.id) {
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

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
