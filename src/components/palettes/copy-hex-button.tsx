"use client";

import { useState } from "react";
import { copyToClipboard } from "@/components/ui/primitives";

export function CopyHexButton({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyToClipboard(hex)) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }
      }}
      className="rounded-md bg-black/25 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/40"
      aria-label={`Copy ${hex}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
