"use client";

import { useState } from "react";
import { copyToClipboard } from "@/components/ui/primitives";
import Link from "next/link";

type Props = {
  projectId: string;
  visibility: "private" | "public";
};

export function ShareButton({ projectId, visibility }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/p/${projectId}`;
    if (await copyToClipboard(url)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  if (visibility === "private") {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          Private
        </span>
        <Link
          href={`/design-system?project=${projectId}`}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Open in generator
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
        Public
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {copied ? "Copied!" : "Copy share link"}
      </button>
      <Link
        href={`/design-system?project=${projectId}`}
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Open in generator
      </Link>
    </div>
  );
}
