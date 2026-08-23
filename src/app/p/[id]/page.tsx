import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClientProjectView } from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true, description: true, visibility: true },
  });
  if (!project || project.visibility === "private") {
    return { title: "Not found" };
  }
  return {
    title: `${project.name} · ChromaBrew`,
    description: project.description ?? `Design system: ${project.name}`,
  };
}

export default async function PublicProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      config: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  });

  if (!project || project.visibility === "private") notFound();

  return (
    <ClientProjectView
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        config: project.config as unknown as Record<string, unknown>,
        createdAt: project.createdAt.toISOString(),
        author: project.user.name ?? "Anonymous",
      }}
    />
  );
}
