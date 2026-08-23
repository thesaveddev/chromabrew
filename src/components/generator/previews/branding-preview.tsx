"use client";

import type { DesignSystem } from "@/lib/design-system/types";

type Props = {
  system: DesignSystem;
};

export function BrandingPreview({ system }: Props) {
  const { themes } = system;
  const light = themes.light;
  const primary = light.primary;
  const secondary = light.secondary;
  const accent = light.accent;
  const foreground = light.foreground;
  const background = light.background;
  const surface = light.surface;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Business Card */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          Business Card
        </p>
        <svg
          viewBox="0 0 320 180"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
          style={{ background: background }}
        >
          {/* Background accent stripe */}
          <rect x="0" y="0" width="8" height="180" fill={primary} />

          {/* Logo area */}
          <rect x="24" y="24" width="40" height="40" rx="8" fill={primary} />
          <text
            x="44"
            y="50"
            textAnchor="middle"
            fill="white"
            fontSize="18"
            fontWeight="bold"
            fontFamily="system-ui"
          >
            C
          </text>

          {/* Company name */}
          <text
            x="24"
            y="90"
            fill={foreground}
            fontSize="16"
            fontWeight="bold"
            fontFamily="system-ui"
          >
            ChromaBrew
          </text>
          <text
            x="24"
            y="106"
            fill={foreground}
            fontSize="8"
            opacity="0.6"
            fontFamily="system-ui"
          >
            Design Systems Studio
          </text>

          {/* Divider */}
          <rect x="24" y="120" width="60" height="2" rx="1" fill={accent} />

          {/* Contact info */}
          <text
            x="24"
            y="140"
            fill={foreground}
            fontSize="7"
            opacity="0.7"
            fontFamily="system-ui"
          >
            hello@chromabrew.com
          </text>
          <text
            x="24"
            y="152"
            fill={foreground}
            fontSize="7"
            opacity="0.7"
            fontFamily="system-ui"
          >
            chromabrew.com
          </text>

          {/* Accent dots */}
          <circle cx="280" cy="24" r="4" fill={accent} />
          <circle cx="292" cy="24" r="4" fill={secondary} />
          <circle cx="304" cy="24" r="4" fill={primary} />
        </svg>
      </div>

      {/* T-Shirt */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          T-Shirt
        </p>
        <svg
          viewBox="0 0 320 200"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
          style={{ background: surface }}
        >
          {/* Shirt body */}
          <path
            d="M80 60 L120 40 L200 40 L240 60 L260 50 L280 70 L260 90 L240 80 L240 180 L80 180 L80 80 L60 90 L40 70 L60 50 Z"
            fill={primary}
            stroke={foreground}
            strokeWidth="0.5"
            opacity="0.95"
          />

          {/* Collar */}
          <path
            d="M120 40 L160 55 L200 40"
            fill="none"
            stroke={surface}
            strokeWidth="2"
          />

          {/* Design on shirt */}
          <rect x="130" y="80" width="60" height="60" rx="8" fill={accent} />
          <text
            x="160"
            y="115"
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="bold"
            fontFamily="system-ui"
          >
            CB
          </text>
          <text
            x="160"
            y="135"
            textAnchor="middle"
            fill="white"
            fontSize="6"
            opacity="0.8"
            fontFamily="system-ui"
          >
            BREW YOUR DESIGN
          </text>

          {/* Sleeve accents */}
          <path
            d="M80 60 L60 50 L40 70 L60 90 L80 80"
            fill={secondary}
            opacity="0.3"
          />
          <path
            d="M240 60 L260 50 L280 70 L260 90 L240 80"
            fill={secondary}
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Coffee Mug */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          Coffee Mug
        </p>
        <svg
          viewBox="0 0 320 200"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
          style={{ background: background }}
        >
          {/* Table surface */}
          <rect x="40" y="140" width="240" height="40" rx="4" fill={surface} opacity="0.5" />

          {/* Mug body */}
          <rect
            x="100"
            y="50"
            width="120"
            height="100"
            rx="8"
            fill="white"
            stroke={foreground}
            strokeWidth="1"
            opacity="0.15"
          />
          <rect
            x="100"
            y="50"
            width="120"
            height="100"
            rx="8"
            fill={primary}
          />

          {/* Handle */}
          <path
            d="M220 70 Q260 70 260 100 Q260 130 220 130"
            fill="none"
            stroke={primary}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M220 75 Q255 75 255 100 Q255 125 220 125"
            fill="none"
            stroke="white"
            opacity="0.15"
            strokeWidth="8"
          />

          {/* Logo on mug */}
          <text
            x="160"
            y="105"
            textAnchor="middle"
            fill="white"
            fontSize="22"
            fontWeight="bold"
            fontFamily="system-ui"
          >
            C
          </text>

          {/* Steam */}
          <path
            d="M140 45 Q145 30 140 20"
            fill="none"
            stroke={foreground}
            strokeWidth="1"
            opacity="0.2"
          />
          <path
            d="M155 42 Q160 25 155 15"
            fill="none"
            stroke={foreground}
            strokeWidth="1"
            opacity="0.15"
          />
          <path
            d="M170 45 Q175 30 170 20"
            fill="none"
            stroke={foreground}
            strokeWidth="1"
            opacity="0.2"
          />
        </svg>
      </div>

      {/* Pen */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          Branded Pen
        </p>
        <svg
          viewBox="0 0 320 200"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
          style={{ background: background }}
        >
          {/* Shadow */}
          <ellipse cx="160" cy="165" rx="80" ry="8" fill={foreground} opacity="0.05" />

          {/* Pen body */}
          <rect
            x="60"
            y="85"
            width="200"
            height="24"
            rx="12"
            fill={primary}
          />

          {/* Grip section */}
          <rect
            x="60"
            y="85"
            width="50"
            height="24"
            rx="12"
            fill={accent}
          />

          {/* Clip */}
          <path
            d="M240 85 L260 85 L260 115 L240 115 L240 100 L250 100 L250 85"
            fill={secondary}
            stroke={foreground}
            strokeWidth="0.5"
            opacity="0.8"
          />

          {/* Tip */}
          <path
            d="M60 85 L40 97 L60 109"
            fill={foreground}
            opacity="0.3"
          />

          {/* Brand text on pen */}
          <text
            x="160"
            y="101"
            textAnchor="middle"
            fill="white"
            fontSize="8"
            fontWeight="bold"
            fontFamily="system-ui"
            letterSpacing="2"
          >
            CHROMABREW
          </text>

          {/* Clip accent */}
          <circle cx="255" cy="88" r="2" fill={accent} />
        </svg>
      </div>
    </div>
  );
}
