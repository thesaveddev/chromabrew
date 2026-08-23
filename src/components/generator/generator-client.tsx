"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { buildDesignSystem } from "@/lib/design-system";
import {
  configFromParams,
  configToQueryString,
  DEFAULT_CONFIG,
} from "@/lib/design-system/share";
import { buildAccessibilityReport } from "@/lib/design-system/tokens/generate";
import type {
  GeneratorConfig,
  PaletteStrategyId,
  RadiusStyle,
  SemanticTokenId,
  ThemeMode,
  TypeScaleRatio,
} from "@/lib/design-system/types";
import { regeneratePalette } from "@/lib/design-system/palette/generate";
import { track } from "@/lib/analytics";
import { Button, TabList, copyToClipboard } from "@/components/ui/primitives";
import { SourcePanel } from "./panels/source-panel";
import { ScalePanel } from "./panels/scale-panel";
import { PalettePanel } from "./panels/palette-panel";
import { PrimitivesPanel } from "./panels/primitives-panel";
import { TokensPanel } from "./panels/tokens-panel";
import { AccessibilityPanel } from "./panels/accessibility-panel";
import { ExportPanel } from "./panels/export-panel";
import { AiPaletteSuggestion } from "./ai-palette-suggestion";
import { PreviewFrame } from "./previews/preview-frame";
import { SaasPreview } from "./previews/saas-preview";
import { MarketingPreview } from "./previews/marketing-preview";
import { EcommercePreview } from "./previews/ecommerce-preview";
import { MobilePreview } from "./previews/mobile-preview";

type PreviewId = "saas" | "marketing" | "ecommerce" | "mobile";

const PREVIEW_OPTIONS = [
  { id: "saas" as const, label: "SaaS dashboard" },
  { id: "marketing" as const, label: "Marketing site" },
  { id: "ecommerce" as const, label: "Ecommerce" },
  { id: "mobile" as const, label: "Mobile app" },
];

const MODE_OPTIONS = [
  { id: "light" as const, label: "Light" },
  { id: "dark" as const, label: "Dark" },
];

function initialConfig(): GeneratorConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  return configFromParams(new URLSearchParams(window.location.search));
}

function getProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("project");
}

export function GeneratorWorkspace() {
  const { data: session } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState<GeneratorConfig>(initialConfig);
  const [mode, setMode] = useState<ThemeMode>("light");
  const [preview, setPreview] = useState<PreviewId>("saas");
  const [projectId, setProjectId] = useState<string | null>(getProjectId);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const loadedProject = useRef(false);
  /** Per-mode manual fixes applied after generation (from Fix contrast). */
  const [fixes, setFixes] = useState<Record<ThemeMode, Partial<Record<SemanticTokenId, string>>>>({
    light: {},
    dark: {},
  });

  /* ---- load project on mount ----------------------------------------- */
  useEffect(() => {
    if (loadedProject.current) return;
    const pid = new URLSearchParams(window.location.search).get("project");
    if (!pid) return;
    loadedProject.current = true;
    setProjectId(pid); // eslint-disable-line react-hooks/set-state-in-effect -- initial project load from URL
    void fetch(`/api/projects/${pid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) {
          setConfig(data.config as unknown as GeneratorConfig);
          setProjectName(data.name ?? "");
        }
      })
      .catch(() => {});
  }, []);

  /* ---- derived system ------------------------------------------------ */
  const baseSystem = useMemo(() => buildDesignSystem(config), [config]);

  const system = useMemo(() => {
    const hasFixes = Object.keys(fixes.light).length + Object.keys(fixes.dark).length > 0;
    if (!hasFixes) return baseSystem;
    const themes = {
      light: { ...baseSystem.themes.light, ...fixes.light },
      dark: { ...baseSystem.themes.dark, ...fixes.dark },
    };
    return {
      ...baseSystem,
      themes,
      accessibility: buildAccessibilityReport(themes),
    };
  }, [baseSystem, fixes]);

  /* ---- shareable URL -------------------------------------------------- */
  useEffect(() => {
    const query = configToQueryString(config);
    window.history.replaceState(null, "", query);
  }, [config]);

  const [shareCopied, setShareCopied] = useState(false);
  const copyShareLink = useCallback(async () => {
    const url = `${window.location.origin}${configToQueryString(config)}`;
    if (await copyToClipboard(url)) {
      setShareCopied(true);
      track("share_url_copied");
      window.setTimeout(() => setShareCopied(false), 1600);
    }
  }, [config]);

  /* ---- config mutations ---------------------------------------------- */

  const setPrimary = (hex: string) =>
    setConfig((prev) => ({ ...prev, primary: hex }));

  const applyAiPalette = (hex: string) => {
    setPrimary(hex);
    setConfig((prev) => ({
      ...prev,
      paletteStrategy: "complementary",
      lockedIndices: [],
      paletteOverrides: {},
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setStrategy = (strategy: PaletteStrategyId) => {
    track("palette_strategy_changed", { strategy });
    setConfig((prev) => ({
      ...prev,
      paletteStrategy: strategy,
      lockedIndices: [],
      paletteOverrides: {},
    }));
  };

  const toggleLock = (index: number) =>
    setConfig((prev) => ({
      ...prev,
      lockedIndices: prev.lockedIndices.includes(index)
        ? prev.lockedIndices.filter((i) => i !== index)
        : [...prev.lockedIndices, index],
    }));

  const editSwatch = (index: number, hex: string | null) => {
    if (hex === null || hex === undefined) return;
    setConfig((prev) => ({
      ...prev,
      paletteOverrides: { ...prev.paletteOverrides, [index]: hex },
    }));
  };

  const setRadiusStyle = (radiusStyle: RadiusStyle) =>
    setConfig((prev) => ({ ...prev, radiusStyle }));

  const setTypeRatio = (typeRatio: TypeScaleRatio) =>
    setConfig((prev) => ({ ...prev, typeRatio }));

  const applyFix = (fixMode: ThemeMode, token: SemanticTokenId, hex: string) =>
    setFixes((prev) => ({
      ...prev,
      [fixMode]: { ...prev[fixMode], [token]: hex },
    }));

  /* ---- save / update project ----------------------------------------- */
  const saveProject = useCallback(async () => {
    if (!session?.user?.id) {
      router.push("/sign-in");
      return;
    }
    setSaving(true);
    setSaveMessage("");
    try {
      const name = projectName || `Design system ${config.primary.toUpperCase()}`;
      if (projectId) {
        // Create a version snapshot before updating
        await fetch(`/api/projects/${projectId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: name, config }),
        });
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, config }),
        });
        if (res.ok) {
          setSaveMessage("Saved");
          track("project_updated");
        }
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, config }),
        });
        if (res.ok) {
          const data = await res.json();
          setProjectId(data.id);
          window.history.replaceState(null, "", `?project=${data.id}`);
          setSaveMessage("Saved");
          track("project_created");
        }
      }
    } catch {
      setSaveMessage("Error saving");
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveMessage(""), 2000);
    }
  }, [session, projectId, projectName, config, router]);

  /* ---- palette with lock/edit state merged ---------------------------- */
  const palette = useMemo(() => {
    const seeded = system.primitives.colors.palette.map((swatch) => ({
      ...swatch,
      locked: config.lockedIndices.includes(swatch.index),
      edited: Boolean(config.paletteOverrides[swatch.index]),
      hex: config.paletteOverrides[swatch.index] ?? swatch.hex,
    }));
    return regeneratePalette(config.primary, config.paletteStrategy, seeded);
  }, [
    system,
    config.primary,
    config.paletteStrategy,
    config.lockedIndices,
    config.paletteOverrides,
  ]);

  const previewNode = (
    <PreviewFrame system={system} mode={mode}>
      {preview === "saas" && <SaasPreview system={system} />}
      {preview === "marketing" && <MarketingPreview system={system} />}
      {preview === "ecommerce" && <EcommercePreview system={system} />}
      {preview === "mobile" && <MobilePreview system={system} />}
    </PreviewFrame>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
      {/* Toolbar */}
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Design system{" "}
            <span className="font-mono font-normal text-zinc-500">
              {system.source.primary.hex.toUpperCase()}
            </span>
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <TabList
              label="Theme mode"
              size="sm"
              options={MODE_OPTIONS}
              value={mode}
              onChange={(next) => {
                setMode(next);
                if (next === "dark") track("dark_mode_previewed");
              }}
            />
            {session?.user && (
              <Button
                type="button"
                variant="secondary"
                className="px-2.5 py-1 text-xs"
                onClick={saveProject}
                disabled={saving}
              >
                {saving ? "Saving…" : saveMessage || "Save"}
              </Button>
            )}
            <Button type="button" variant="secondary" className="px-2.5 py-1 text-xs" onClick={copyShareLink}>
              {shareCopied ? "Link copied" : "Share link"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* Configuration rail */}
        <div className="space-y-8">
          <SourcePanel primary={config.primary} onPrimaryChange={setPrimary} />
          <ScalePanel scale={system.primitives.colors.scale} />
          <PalettePanel
            palette={palette}
            strategy={config.paletteStrategy}
            onStrategyChange={setStrategy}
            onToggleLock={toggleLock}
            onEditSwatch={editSwatch}
          />
          <PrimitivesPanel
            system={system}
            onRadiusChange={setRadiusStyle}
            onTypeRatioChange={setTypeRatio}
          />
        </div>

        {/* Preview + analysis column */}
        <div className="min-w-0 space-y-10">
          <section aria-label="Live interface previews" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabList
                label="Preview environment"
                size="sm"
                options={PREVIEW_OPTIONS}
                value={preview}
                onChange={setPreview}
              />
              <p className="text-[11px] text-zinc-400">
                Placeholder content — your tokens, real interfaces
              </p>
            </div>
            {previewNode}
          </section>

          <AccessibilityPanel report={system.accessibility} onApplyFix={applyFix} />
          <TokensPanel themes={system.themes} />
          <AiPaletteSuggestion onApply={applyAiPalette} />
          <ExportPanel system={system} />

          {Object.keys(fixes.light).length + Object.keys(fixes.dark).length > 0 ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                className="text-xs"
                onClick={() => setFixes({ light: {}, dark: {} })}
              >
                Reset contrast fixes
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
