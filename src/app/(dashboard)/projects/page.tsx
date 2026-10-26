import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseGalleryConfig, projectPalette } from "@/lib/gallery";
import { ProjectsList } from "@/components/projects/projects-list";
import { SharedProjects } from "@/components/projects/shared-projects";

export const metadata = {
  title: "My projects",
  robots: { index: false },
};

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
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

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <ProjectsList
          initialProjects={projects.map((p) => {
            const config = parseGalleryConfig(p.config);
            return {
              id: p.id,
              name: p.name,
              description: p.description,
              visibility: p.visibility,
              listedInGallery: p.listedInGallery,
              colors: config ? projectPalette(config) : null,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
            };
          })}
        />
        <SharedProjects />
      </div>
    </div>
  );
}
