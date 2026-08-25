import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectsList } from "@/components/projects/projects-list";

export const metadata = {
  title: "My projects · ChromaBrew",
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
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <ProjectsList
          initialProjects={projects.map((p: { id: string; name: string; description: string | null; visibility: "private" | "public"; createdAt: Date; updatedAt: Date }) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
