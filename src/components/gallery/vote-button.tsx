"use client";

import { useState } from "react";

/**
 * One community entry's up-vote button: the count plus the reader's state in
 * a single control. Toggles optimistically and reconciles with the route's
 * answer, rolling back on failure so the count never lies about the server.
 * No account needed — the route identifies anonymous readers by hashed IP.
 */
export function VoteButton({
  projectId,
  initialVotes,
  initialVoted,
  compact = false,
}: {
  projectId: string;
  initialVotes: number;
  initialVoted: boolean;
  compact?: boolean;
}) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(initialVoted);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !voted;
    setVoted(next);
    setVotes((count) => count + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/gallery/${projectId}/vote`, { method: "POST" });
      if (!res.ok) throw new Error(`vote failed: ${res.status}`);
      const data = (await res.json()) as { votes: number; voted: boolean };
      setVotes(data.votes);
      setVoted(data.voted);
    } catch {
      // The server refused or was unreachable: put the button back where the
      // server has it rather than showing a vote that was never counted.
      setVoted(!next);
      setVotes((count) => count + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={voted}
      aria-label={
        voted
          ? `Remove your up-vote (${votes} ${votes === 1 ? "vote" : "votes"} total)`
          : `Up-vote this palette (${votes} ${votes === 1 ? "vote" : "votes"} so far)`
      }
      title={voted ? "Remove your up-vote" : "Up-vote this palette"}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors disabled:opacity-60 ${
        compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"
      } ${
        voted
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
      }`}
    >
      <svg
        width={compact ? 12 : 14}
        height={compact ? 12 : 14}
        viewBox="0 0 16 16"
        fill={voted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path
          strokeLinejoin="round"
          d="M8 14.5 6.6 13.2C3.4 10.3 1.5 8.3 1.5 5.9 1.5 4 3 2.5 4.9 2.5c1.1 0 2.1.5 3.1 1.6C9 3 10 2.5 11.1 2.5 13 2.5 14.5 4 14.5 5.9c0 2.4-1.9 4.4-5.1 7.3L8 14.5Z"
        />
      </svg>
      <span aria-hidden="true">{votes}</span>
    </button>
  );
}
