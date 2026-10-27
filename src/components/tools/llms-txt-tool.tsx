"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { buildAiTxt, buildLlmsTxt, DEFAULT_AI_AGENTS } from "@/lib/ai-files";
import { track } from "@/lib/analytics";
import { CopyButton } from "@/components/ui/primitives";

const MAX_PAGES = 5;

interface KeyPage {
  label: string;
  url: string;
}

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const inputClass =
  "block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500";
const labelClass =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

/**
 * The llms.txt workbench: describe the site once, get both discovery files
 * with a live preview, then copy or download each. Everything derives from
 * the form state on every render, so the preview can never drift from what
 * the download button hands over.
 */
export function LlmsTxtTool() {
  const [siteName, setSiteName] = useState("");
  const [homepage, setHomepage] = useState("");
  const [summary, setSummary] = useState("");
  const [contact, setContact] = useState("");
  const [pages, setPages] = useState<KeyPage[]>([{ label: "", url: "" }]);
  const [allow, setAllow] = useState<string[]>([...DEFAULT_AI_AGENTS]);
  const [disallow, setDisallow] = useState("");

  const files = useMemo(() => {
    try {
      const llms = buildLlmsTxt({
        siteName,
        summary,
        homepage,
        sections: [
          {
            title: "Key pages",
            links: pages
              .filter((page) => page.label.trim() && page.url.trim())
              .map((page) => ({ label: page.label, url: page.url })),
          },
        ],
        contact,
      });
      const ai = buildAiTxt({
        siteName,
        homepage,
        contact,
        allow,
        disallow: disallow
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      return {
        error: null as string | null,
        llms,
        ai,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Something went wrong",
        llms: "",
        ai: "",
      };
    }
  }, [siteName, homepage, summary, contact, pages, allow, disallow]);

  const toggleAgent = (agent: string) =>
    setAllow((current) =>
      current.includes(agent)
        ? current.filter((a) => a !== agent)
        : [...current, agent],
    );

  const setPage = (index: number, patch: Partial<KeyPage>) =>
    setPages((current) =>
      current.map((page, i) => (i === index ? { ...page, ...patch } : page)),
    );

  const ready = files.error === null;

  const onDownload = (filename: string, content: string) => {
    download(filename, content);
    track("ai_files_downloaded");
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="llms-site-name" className={labelClass}>
            Site name
          </label>
          <input
            id="llms-site-name"
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Acme Bank"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="llms-homepage" className={labelClass}>
            Homepage URL
          </label>
          <input
            id="llms-homepage"
            type="text"
            inputMode="url"
            value={homepage}
            onChange={(e) => setHomepage(e.target.value)}
            placeholder="acmebank.com"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="llms-summary" className={labelClass}>
            What the site does
          </label>
          <textarea
            id="llms-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Everyday checking and savings accounts with no hidden fees."
            rows={2}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="llms-contact" className={labelClass}>
            Contact <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            id="llms-contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="press@acmebank.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>Key pages <span className="font-normal text-zinc-400">(up to {MAX_PAGES})</span></span>
        <ul className="mt-1 space-y-2">
          {pages.map((page, i) => (
            <li key={i} className="flex gap-2">
              <input
                type="text"
                aria-label={`Page ${i + 1} label`}
                value={page.label}
                onChange={(e) => setPage(i, { label: e.target.value })}
                placeholder="Checking"
                className={inputClass}
              />
              <input
                type="text"
                aria-label={`Page ${i + 1} URL`}
                value={page.url}
                onChange={(e) => setPage(i, { url: e.target.value })}
                placeholder="https://…"
                inputMode="url"
                className={inputClass}
              />
              {pages.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setPages((current) => current.filter((_, j) => j !== i))}
                  aria-label={`Remove page ${i + 1}`}
                  className="shrink-0 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {pages.length < MAX_PAGES ? (
          <button
            type="button"
            onClick={() => setPages((current) => [...current, { label: "", url: "" }])}
            className="mt-2 text-xs font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            Add another page
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className={labelClass}>Agents allowed to read the site</legend>
          <ul className="flex flex-wrap gap-2">
            {DEFAULT_AI_AGENTS.map((agent) => (
              <li key={agent}>
                <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${allow.includes(agent) ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"}`}>
                  <input
                    type="checkbox"
                    checked={allow.includes(agent)}
                    onChange={() => toggleAgent(agent)}
                    className="sr-only"
                  />
                  {agent}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <div>
          <label htmlFor="llms-disallow" className={labelClass}>
            Keep out <span className="font-normal text-zinc-400">(one path per line, optional)</span>
          </label>
          <textarea
            id="llms-disallow"
            value={disallow}
            onChange={(e) => setDisallow(e.target.value)}
            placeholder="/account&#10;/internal"
            rows={3}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      {!siteName.trim() || !homepage.trim() ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Add a site name and homepage URL and both files appear below, ready
          to copy or download.
        </p>
      ) : files.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{files.error}</p>
      ) : (
        <div className="space-y-6">
          {[
            { filename: "llms.txt", content: files.llms },
            { filename: "ai.txt", content: files.ai },
          ].map((file) => (
            <section
              key={file.filename}
              aria-label={file.filename}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <h2 className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  /{file.filename}
                </h2>
                <span className="ml-auto flex gap-2">
                  <CopyButton value={file.content} />
                  <button
                    type="button"
                    onClick={() => onDownload(file.filename, file.content)}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    Download
                  </button>
                </span>
              </div>
              <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-5 text-zinc-700 dark:text-zinc-300">
                {file.content}
              </pre>
            </section>
          ))}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Upload both files to your site root, next to robots.txt — then{" "}
            <Link href="/audit" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              run the website audit
            </Link>{" "}
            to confirm crawlers can reach them.
          </p>
        </div>
      )}
    </div>
  );
}
