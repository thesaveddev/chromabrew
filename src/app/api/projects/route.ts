import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { parseGalleryConfig, projectPalette } from "@/lib/gallery";
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
  const scope = searchParams.get("scope");

  // Projects other people shared with the caller: newest grant first, with
  // the caller's role attached so the UI can offer (or withhold) editing.
  // Thumbnails use the same derived palette as the owned list, so a shared
  // project is recognisable before it is opened.
  if (scope === "shared") {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            visibility: true,
            listedInGallery: true,
            config: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { name: true } },
          },
        },
      },
    });
    return NextResponse.json(
      memberships.map((m) => {
        const config = parseGalleryConfig(m.project.config);
        return {
          id: m.project.id,
          name: m.project.name,
          description: m.project.description,
          visibility: m.project.visibility,
          listedInGallery: m.project.listedInGallery,
          colors: config ? projectPalette(config) : null,
          createdAt: m.project.createdAt,
          updatedAt: m.project.updatedAt,
          ownerName: m.project.user.name,
          role: m.role,
        };
      }),
    );
  }

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
      listedInGallery: true,
      config: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Thumbnails are derived palette swatches, not the stored config — the
  // raw generator config never leaves the server on this endpoint.
  const shaped = projects.map((p) => {
    const config = parseGalleryConfig(p.config);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      visibility: p.visibility,
      listedInGallery: p.listedInGallery,
      colors: config ? projectPalette(config) : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  return NextResponse.json(shaped);
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
