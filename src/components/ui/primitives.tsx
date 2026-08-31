"use client";

import { forwardRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 active:bg-zinc-800 disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-200",
  secondary:
    "border border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:disabled:text-zinc-600",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
};

const baseButton =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 disabled:cursor-not-allowed";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ className = "", variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`${baseButton} ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
});

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<"a">, "href">) {
  return (
    <a
      href={href}
      className={`${baseButton} ${buttonStyles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Copy to clipboard                                                   */
/* ------------------------------------------------------------------ */

/** Clipboard write that never throws (permissions may be denied). */
export async function copyToClipboard(text: string): Promise<boolean> {
  return copyText(text);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
  variant = "secondary",
  onCopied,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: ButtonVariant;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant={copied ? "primary" : variant}
      className={className}
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          onCopied?.();
          window.setTimeout(() => setCopied(false), 1600);
        }
      }}
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Download                                                            */
/* ------------------------------------------------------------------ */

export function DownloadButton({
  filename,
  content,
  label = "Download",
  className = "",
  binary = false,
  mimeType = "text/plain;charset=utf-8",
}: {
  filename: string;
  content: string;
  label?: string;
  className?: string;
  binary?: boolean;
  mimeType?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={className}
      onClick={() => {
        const blob = binary
          ? base64ToBlob(content, mimeType)
          : new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }}
    >
      {label}
    </Button>
  );
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mimeType });
}

/* ------------------------------------------------------------------ */
/* Tabs (accessible, roving behaviour not required — arrow keys via    */
/* native radio pattern is overkill for two-to-four options)           */
/* ------------------------------------------------------------------ */

export interface TabOption<T extends string> {
  id: T;
  label: string;
}

export function TabList<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/80"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 ${
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
            } ${
              active
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
