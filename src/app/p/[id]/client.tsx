"use client";

import { useMemo } from "react";
import { buildDesignSystem } from "@/lib/design-system";
import type { GeneratorConfig } from "@/lib/design-system/types";
import { DEFAULT_CONFIG } from "@/lib/design-system/share";
import { PreviewFrame } from "@/components/generator/previews/preview-frame";
import { SaasPreview } from "@/components/generator/previews/saas-preview";
import { MarketingPreview } from "@/components/generator/previews/marketing-preview";
import { EcommercePreview } from "@/components/generator/previews/ecommerce-preview";
import { MobilePreview } from "@/components/generator/previews/mobile-preview";

type Props = {
  project: {
    id: string;
    name: string;
    description: string | null;
    config: Record<string, unknown>;
    createdAt: string;
    author: string;
  };
};

export function ClientProjectView({ project }: Props) {
  const config = useMemo(() => {
    try {
      return project.config as unknown as GeneratorConfig;
    } catch {
      return DEFAULT_CONFIG;
    }
  }, [project.config]);

  const system = useMemo(() => buildDesignSystem(config), [config]);

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {project.description}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-400">
            by {project.author} · created{" "}
            {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        <PreviewFrame system={system} mode="light">
          <SaasPreview system={system} />
        </PreviewFrame>

        <div className="grid gap-6 sm:grid-cols-2">
          <PreviewFrame system={system} mode="light">
            <MarketingPreview system={system} />
          </PreviewFrame>
          <PreviewFrame system={system} mode="light">
            <EcommercePreview system={system} />
          </PreviewFrame>
        </div>

        <PreviewFrame system={system} mode="light">
          <MobilePreview system={system} />
        </PreviewFrame>
      </div>
    </div>
  );
}
