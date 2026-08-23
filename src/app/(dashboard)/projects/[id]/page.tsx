import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectDetail } from "@/components/projects/project-detail";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: project ? `${project.name} · ChromaBrew` : "Not found" };
}

export default async function ProjectDetailPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  });

  if (!project || project.userId !== session.user.id) notFound();

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
      <ProjectDetail
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          visibility: project.visibility,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
