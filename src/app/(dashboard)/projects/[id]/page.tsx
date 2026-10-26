import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectDetail } from "@/components/projects/project-detail";
import {
  canViewProject,
  resolveProjectAccess,
  type ProjectMemberRole,
} from "@/lib/projects/access";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: project ? `${project.name} · ChromaBrew` : "Not found",
    robots: { index: false },
  };
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
      listedInGallery: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  if (!project) notFound();
  // Owners and members (viewers included) land here; strangers get the same
  // 404 as a missing project, so private work cannot be probed.
  const access = resolveProjectAccess({
    ownerId: project.userId,
    userId: session.user.id,
    memberRole: (project.members[0]?.role ?? null) as ProjectMemberRole | null,
  });
  // The dashboard detail view is for the team: owners and members. Anyone
  // else — including a signed-in stranger on a public project — belongs on
  // the public /p/[id] page, so null access is a 404 here even when the
  // project itself is public.
  if (access === null || !canViewProject(project.visibility, access)) notFound();

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
      {/* Suspense boundary for the ?tab= deep-link inside ProjectDetail. */}
      <Suspense>
        <ProjectDetail
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            visibility: project.visibility,
            listedInGallery: project.listedInGallery,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
          }}
          access={access}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
