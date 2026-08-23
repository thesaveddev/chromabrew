import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { GeneratorConfig } from "@/lib/design-system/types";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const visibility = searchParams.get("visibility") as "private" | "public" | null;

  const where: Prisma.ProjectWhereInput = {
    userId: session.user.id,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(visibility && { visibility }),
  };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, config } = body as {
    name: string;
    description?: string;
    config: GeneratorConfig;
  };

  if (!name || !config) {
    return NextResponse.json(
      { error: "name and config are required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? null,
      config: config as unknown as Prisma.InputJsonValue,
      userId: session.user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
