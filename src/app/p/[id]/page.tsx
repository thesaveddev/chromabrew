import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { clampDescription } from "@/lib/meta";
import {
  isDuplicateConfig,
  projectIndexingEnabled,
  projectIndexVerdict,
  type ProjectIndexInput,
} from "@/lib/project-indexing";
import { ClientProjectView } from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      visibility: true,
      listedInGallery: true,
      config: true,
      createdAt: true,
      versions: { select: { id: true }, take: 1 },
    },
  });
  if (!project || project.visibility === "private") {
    return { title: "Not found", robots: { index: false } };
  }

  const gates: ProjectIndexInput = {
    visibility: project.visibility,
    listedInGallery: project.listedInGallery,
    name: project.name,
    description: project.description,
    config: project.config,
    createdAt: project.createdAt,
    savedVersionCount: project.versions.length,
    // Cheap gates first; the clone query only runs for a project that could
    // actually be indexed (see docs/PROGRAMMATIC_SEO_PLAN.md §3a).
    duplicateConfig: false,
  };
  let verdict = projectIndexVerdict(gates);
  if (verdict.indexable) {
    const others = await prisma.project.findMany({
      where: { visibility: "public", listedInGallery: true, id: { not: id } },
      select: { config: true },
    });
    verdict = projectIndexVerdict({
      ...gates,
      duplicateConfig: isDuplicateConfig(
        project.config,
        others.map((other) => other.config),
      ),
    });
  }

  return {
    // Bare title: the root layout's template appends " · ChromaBrew" — the old
    // value spelled the brand here too and rendered it twice. The name is
    // clamped so the rendered title stays inside the ~60-char SERP point.
    title: `${clampDescription(project.name, 32)} Design System`,
    description: clampDescription(project.description ?? `Design system: ${project.name}`),
    // Without this the page inherits the layout's canonical ("/") and tells
    // search engines it is a duplicate of the home page.
    alternates: { canonical: `/p/${id}` },
    // Stage B: the verdict is computed (and unit tested) but the
    // PROJECT_INDEXING switch is off, so every project serves noindex.
    robots: { index: projectIndexingEnabled() && verdict.indexable },
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
