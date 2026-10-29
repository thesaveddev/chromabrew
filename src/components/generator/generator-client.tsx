"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { buildDesignSystem, normaliseConfig } from "@/lib/design-system";
import {
  configFromParams,
  configToQueryString,
  DEFAULT_CONFIG,
} from "@/lib/design-system/share";
import { buildAccessibilityReport } from "@/lib/design-system/tokens/generate";
import type {
  DarkBackgroundStyle,
  FontPairingId,
  GeneratorConfig,
  PaletteStrategyId,
  RadiusStyle,
  Refinement,
  SemanticTokenId,
  ThemeMode,
  TypeScaleRatio,
} from "@/lib/design-system/types";
import { normaliseHue, randomPleasantHex, randomTrio } from "@/lib/design-system/colour/refine";
import { deriveCompanions } from "@/lib/design-system/colour/companions";
import { hexToRgb, rgbToOklch } from "@/lib/design-system/colour/convert";
import { regeneratePalette } from "@/lib/design-system/palette/generate";
import { applyRefinement } from "@/lib/design-system/colour/refine";
import { track } from "@/lib/analytics";
import { Button, TabList, copyToClipboard } from "@/components/ui/primitives";
import { SourcePanel } from "./panels/source-panel";
import { ScalePanel } from "./panels/scale-panel";
import { PalettePanel } from "./panels/palette-panel";
import { RefinementPanel } from "./panels/refinement-panel";
import { PrimitivesPanel } from "./panels/primitives-panel";
import { TokensPanel } from "./panels/tokens-panel";
import { AccessibilityPanel } from "./panels/accessibility-panel";
import { ExportModalButton } from "./export-modal";
import { HistoryPanel } from "./panels/history-panel";
import { usePaletteHistory, type HistoryEntry } from "./use-palette-history";
import { PreviewColorPicker } from "./preview-color-picker";
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

export function GeneratorWorkspace() {
  const { data: session } = useSession();
  // Start from the default so the first client render matches the
  // server-rendered HTML; URL/project config is adopted post-hydration.
  const [config, setConfig] = useState<GeneratorConfig>(DEFAULT_CONFIG);
  const [mode, setMode] = useState<ThemeMode>("light");
  const [preview, setPreview] = useState<PreviewId>("saas");
  const [pickingColours, setPickingColours] = useState(false);
  /** Locked trio slots survive Random and primary changes. UI-only, not saved. */
  const [lockedSlots, setLockedSlots] = useState({
    primary: false,
    secondary: false,
    accent: false,
  });
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const loadedProject = useRef(false);
  /** Per-mode manual fixes applied after generation (from Fix contrast). */
  const [fixes, setFixes] = useState<Record<ThemeMode, Partial<Record<SemanticTokenId, string>>>>({
    light: {},
    dark: {},
  });

  const { history, record, clear: clearHistory } = usePaletteHistory();

  /* ---- adopt shared URL / saved project config post-hydration --------- */
  useEffect(() => {
    if (loadedProject.current) return;
    loadedProject.current = true;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("project");
    if (!pid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time bootstrap from window state
      setConfig(normaliseConfig(configFromParams(params)));
      return;
    }
    setProjectId(pid);
    void fetch(`/api/projects/${pid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) {
          setConfig(normaliseConfig(data.config as Partial<GeneratorConfig>));
          setProjectName(data.name ?? "");
        }
      })
      .catch(() => {});
  }, []);

  /* ---- palette history: record applied configs ------------------------ */
  // Skips the initial mount (default config) — only real changes record.
  const prevRecorded = useRef(config);
  useEffect(() => {
    if (prevRecorded.current === config) return;
    prevRecorded.current = config;
    const t = window.setTimeout(() => record(config), 800);
    return () => window.clearTimeout(t);
  }, [config, record]);

  /* ---- derived system ------------------------------------------------ */
  // Deferred so slider drags / quick edits stay smooth; the rebuild is
  // fast but the preview column is large — React can schedule it at a
  // lower priority than the control the user is touching.
  const deferredConfig = useDeferredValue(config);
  const baseSystem = useMemo(() => buildDesignSystem(deferredConfig), [deferredConfig]);

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

  /** Submit picked colours -- one commit, instant system-wide update. */
  const applyColours = useCallback((next: { primary?: string; secondary?: string; accent?: string }) => {
    setConfig((prev) => {
      // A new primary invalidates companions picked for the old one — same
      // rule as Random: unless this same commit also sets them (or the slot
      // is locked), drop explicit secondary/accent so they re-derive from
      // the new primary by role. Locked companions are pinned instead.
      const primaryChanged =
        !!next.primary && next.primary.toLowerCase() !== prev.primary.toLowerCase();
      const oldDerived = primaryChanged ? deriveCompanions(prev.primary) : null;
      const pinSecondary =
        primaryChanged && lockedSlots.secondary && next.secondary === undefined
          ? (prev.secondary ?? oldDerived?.secondary)
          : undefined;
      const pinAccent =
        primaryChanged && lockedSlots.accent && next.accent === undefined
          ? (prev.accent ?? oldDerived?.accent)
          : undefined;
      const resetSecondary =
        primaryChanged && next.secondary === undefined && !lockedSlots.secondary;
      const resetAccent = primaryChanged && next.accent === undefined && !lockedSlots.accent;
      return normaliseConfig({
        ...prev,
        ...(next.primary ? { primary: next.primary } : {}),
        ...(next.secondary !== undefined
          ? { secondary: next.secondary }
          : pinSecondary
            ? { secondary: pinSecondary }
            : resetSecondary
              ? { secondary: undefined }
              : {}),
        ...(next.accent !== undefined
          ? { accent: next.accent }
          : pinAccent
            ? { accent: pinAccent }
            : resetAccent
              ? { accent: undefined }
              : {}),
      });
    });
  }, [lockedSlots]);

  const randomize = useCallback(() => {
    // Fresh trio, minus whatever is locked. Locked slots keep their exact
    // colour (auto slots materialise on lock); unlocked companions follow the
    // new primary when it changes, or roll matching variants when it is
    // pinned — so Random with a locked primary still gives new colours.
    const fresh = randomTrio();
    setConfig((prev) => {
      const newPrimary = lockedSlots.primary ? prev.primary : fresh.primary;
      const oldDerived = deriveCompanions(prev.primary);
      const oldSecondary = prev.secondary ?? oldDerived.secondary;
      const oldAccent = prev.accent ?? oldDerived.accent;
      let newSecondary: string | undefined;
      let newAccent: string | undefined;
      if (lockedSlots.secondary) {
        newSecondary = oldSecondary;
      } else if (lockedSlots.primary) {
        const h = rgbToOklch(hexToRgb(newPrimary)).h;
        newSecondary = randomPleasantHex(
          normaliseHue(h + (Math.random() < 0.5 ? -35 : 35)),
        );
      } else {
        newSecondary = fresh.secondary;
      }
      if (lockedSlots.accent) {
        newAccent = oldAccent;
      } else if (lockedSlots.primary) {
        const h = rgbToOklch(hexToRgb(newPrimary)).h;
        newAccent = randomPleasantHex(
          normaliseHue(h + 150 + Math.random() * 60),
          0.55 + Math.random() * 0.2,
          0.14 + Math.random() * 0.08,
        );
      } else {
        newAccent = fresh.accent;
      }
      // Auto slots stay auto unless locked: undefined re-derives from the new
      // primary by role. Locked auto slots pin their current colour instead.
      const secondaryWasAuto = prev.secondary === undefined;
      const accentWasAuto = prev.accent === undefined;
      return normaliseConfig({
        ...prev,
        primary: newPrimary,
        secondary:
          lockedSlots.secondary || !secondaryWasAuto ? newSecondary : undefined,
        accent: lockedSlots.accent || !accentWasAuto ? newAccent : undefined,
        lockedIndices: [],
        paletteOverrides: {},
      });
    });
    track("palette_randomized");
  }, [lockedSlots]);

  const setStrategy = (strategy: PaletteStrategyId) => {
    track("palette_strategy_changed", { strategy });
    setConfig((prev) =>
      normaliseConfig({
        ...prev,
        paletteStrategy: strategy,
        lockedIndices: [],
        paletteOverrides: {},
      }),
    );
  };

  const setPaletteSize = (size: number) =>
    setConfig((prev) => normaliseConfig({ ...prev, paletteSize: size }));

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

  const setRefinement = (refinement: Refinement) =>
    setConfig((prev) => normaliseConfig({ ...prev, refinement }));

  const toggleSlotLock = useCallback(
    (slot: "primary" | "secondary" | "accent") => {
      // Locking an auto slot pins its current colour so the lock is visible
      // immediately instead of waiting for the next Random.
      if (!lockedSlots[slot] && slot !== "primary") {
        const derived = deriveCompanions(config.primary);
        const current = config[slot] ?? (slot === "secondary" ? derived.secondary : derived.accent);
        setConfig((prev) => normaliseConfig({ ...prev, [slot]: current }));
      }
      setLockedSlots((prev) => ({ ...prev, [slot]: !prev[slot] }));
    },
    [lockedSlots, config],
  );

  const removeSecondary = useCallback(() => {
    setLockedSlots((prev) => ({ ...prev, secondary: false }));
    setConfig((prev) => normaliseConfig({ ...prev, secondary: undefined }));
  }, []);

  const removeAccent = useCallback(() => {
    setLockedSlots((prev) => ({ ...prev, accent: false }));
    setConfig((prev) => normaliseConfig({ ...prev, accent: undefined }));
  }, []);

  const setRadiusStyle = (radiusStyle: RadiusStyle) =>
    setConfig((prev) => normaliseConfig({ ...prev, radiusStyle }));

  const setTypeRatio = (typeRatio: TypeScaleRatio) =>
    setConfig((prev) => normaliseConfig({ ...prev, typeRatio }));

  const setDarkBackground = (darkBackground: DarkBackgroundStyle) =>
    setConfig((prev) => normaliseConfig({ ...prev, darkBackground }));

  const setCustomDarkBg = (customDarkBg: string) =>
    setConfig((prev) => normaliseConfig({ ...prev, customDarkBg }));

  const setFontPairing = (fontPairing: FontPairingId) =>
    setConfig((prev) => normaliseConfig({ ...prev, fontPairing }));

  const restoreHistory = (entry: HistoryEntry) => {
    setConfig(normaliseConfig(entry.config));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyFix = (fixMode: ThemeMode, token: SemanticTokenId, hex: string) =>
    setFixes((prev) => ({
      ...prev,
      [fixMode]: { ...prev[fixMode], [token]: hex },
    }));

  /* ---- save / update project ----------------------------------------- */
  const saveProject = useCallback(async () => {
    if (!session?.user?.id) {
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
          track("project_saved", { mode: "update" });
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
          track("project_saved", { mode: "create" });
        }
      }
    } catch {
      setSaveMessage("Error saving");
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveMessage(""), 2000);
    }
  }, [session, projectId, projectName, config]);

  /* ---- palette with lock/edit state merged ---------------------------- */
  const refinedPrimary = useMemo(
    () => applyRefinement(config.primary, config.refinement),
    [config.primary, config.refinement],
  );

  const palette = useMemo(() => {
    const seeded = system.primitives.colors.palette.map((swatch) => ({
      ...swatch,
      locked: config.lockedIndices.includes(swatch.index),
      edited: Boolean(config.paletteOverrides[swatch.index]),
      hex: config.paletteOverrides[swatch.index] ?? swatch.hex,
    }));
    return regeneratePalette(refinedPrimary, config.paletteStrategy, seeded, {
      size: config.paletteSize,
    });
  }, [
    system,
    refinedPrimary,
    config.paletteStrategy,
    config.paletteSize,
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
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Toolbar */}
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex flex-wrap items-center gap-3">
          {/* Live identity strip -- mirrors the source colours */}
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1" aria-hidden>
              {[
                { name: "Primary", hex: config.primary, derived: false },
                {
                  name: "Secondary",
                  hex: config.secondary ?? system.primitives.colors.secondarySeed.hex,
                  derived: !config.secondary,
                },
                {
                  name: "Accent",
                  hex: config.accent ?? system.primitives.colors.accentSeed.hex,
                  derived: !config.accent,
                },
              ].map(({ name, hex, derived }) => (
                <span
                  key={name}
                  title={`${name} ${hex.toUpperCase()}${derived ? " (derived)" : ""}`}
                  className="h-[18px] w-[18px] rounded-full ring-2 ring-white transition-colors duration-150 dark:ring-zinc-950"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Design system generator{" "}
              <span className="font-mono text-xs font-normal text-zinc-500 dark:text-zinc-400">
                {system.source.primary.hex.toUpperCase()}
              </span>
            </h1>
          </div>
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
            {/* Save-flow nudge: a saved project is one settings visit away
                from the community gallery (?tab=settings lands on the
                visibility + opt-in controls). Only shown once saving is
                possible, i.e. a project id exists. */}
            {session?.user && projectId && (
              <Link
                href={`/projects/${projectId}?tab=settings`}
                className="hidden px-1 py-1 text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-900 sm:inline dark:text-zinc-400 dark:hover:text-zinc-100"
                title="Make this project public and list it in the community gallery"
              >
                Feature in gallery →
              </Link>
            )}
            <Button type="button" variant="secondary" className="px-2.5 py-1 text-xs" onClick={copyShareLink}>
              {shareCopied ? "Link copied" : "Share link"}
            </Button>
            <ExportModalButton system={system} projectName={projectName || undefined} />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* Configuration rail — stays visible while previews scroll */}
        <div className="space-y-8 lg:sticky lg:top-[7.75rem] lg:max-h-[calc(100vh-9rem)] lg:self-start lg:overflow-y-auto lg:pr-1.5">
          <SourcePanel
            primary={config.primary}
            secondary={config.secondary}
            accent={config.accent}
            derivedSecondary={system.primitives.colors.secondarySeed.hex}
            derivedAccent={system.primitives.colors.accentSeed.hex}
            locked={lockedSlots}
            onToggleLock={toggleSlotLock}
            onApply={applyColours}
            onRemoveSecondary={removeSecondary}
            onRemoveAccent={removeAccent}
            onRandomize={randomize}
          />
          <ScalePanel scale={system.primitives.colors.scale} />
          <PalettePanel
            palette={palette}
            strategy={config.paletteStrategy}
            paletteSize={config.paletteSize}
            onStrategyChange={setStrategy}
            onSizeChange={setPaletteSize}
            onToggleLock={toggleLock}
            onEditSwatch={editSwatch}
          />
          <RefinementPanel
            refinement={config.refinement}
            palette={palette}
            onChange={setRefinement}
          />
          <PrimitivesPanel
            system={system}
            config={config}
            onRadiusChange={setRadiusStyle}
            onTypeRatioChange={setTypeRatio}
            onDarkBackgroundChange={setDarkBackground}
            onCustomDarkBgChange={setCustomDarkBg}
            onFontPairingChange={setFontPairing}
          />
          <HistoryPanel history={history} onRestore={restoreHistory} onClear={clearHistory} />
        </div>

        {/* Preview + analysis column */}
        <div className="min-w-0 space-y-10">
          <section aria-label="Live interface previews" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <TabList
                  label="Preview environment"
                  size="sm"
                  options={PREVIEW_OPTIONS}
                  value={preview}
                  onChange={setPreview}
                />
                <Button
                  type="button"
                  variant="secondary"
                  aria-pressed={pickingColours}
                  className="px-2.5 py-1 text-xs"
                  onClick={() => setPickingColours((on) => !on)}
                >
                  {pickingColours ? "Done picking (esc)" : "Pick a color"}
                </Button>
              </div>
              <p className="text-[11px] text-zinc-400">
                {pickingColours
                  ? "Hover any color in the preview — click to copy"
                  : "Placeholder content — your tokens, real interfaces"}
              </p>
            </div>
            <PreviewColorPicker
              active={pickingColours}
              tokens={system.themes[mode]}
              palette={palette.map((swatch) => swatch.hex)}
              onExit={() => setPickingColours(false)}
            >
              {previewNode}
            </PreviewColorPicker>
          </section>

          <section aria-label="Accessibility report">
            <AccessibilityPanel report={system.accessibility} onApplyFix={applyFix} />
          </section>
          <section aria-label="Generated tokens">
            <TokensPanel themes={system.themes} />
          </section>

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
