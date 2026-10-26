"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Member = {
  userId: string;
  name: string | null;
  email: string | null;
  role: "viewer" | "editor";
  createdAt: string;
};

type Props = {
  projectId: string;
  projectName: string;
  /** The signed-in user's id (to identify their own row / leaving). */
  userId: string;
  /** True when the signed-in user owns the project. */
  isOwner: boolean;
};

function displayName(member: Pick<Member, "name" | "email">): string {
  return member.name || member.email || "Unnamed";
}

/**
 * Who has access to the project, and (for the owner) who else gets it.
 *
 * Invites are by email and take effect for the matching account — access is
 * granted to a user row, never to a bearer link, so a forwarded invite
 * cannot leak the project. The owner-only management UI below is a courtesy:
 * the API refuses non-owners regardless.
 */
export function TeamPanel({ projectId, projectName, userId, isOwner }: Props) {
  const router = useRouter();
  const [owner, setOwner] = useState<Pick<Member, "name" | "email"> | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/members`);
    if (res.ok) {
      const data = await res.json();
      setOwner(data.owner);
      setMembers(data.members);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  // The invite surface is the owner's, and team sharing is the Pro surface —
  // so the upsell decision follows the *owner's* plan, which is the caller's
  // plan exactly when the caller is the owner (the only one who sees this).
  useEffect(() => {
    if (!isOwner) return;
    let live = true;
    fetch("/api/billing/plan")
      .then((res) => (res.ok ? res.json() : { plan: "free" as const }))
      .then((data) => {
        if (live) setIsPro(data.plan === "pro");
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [isOwner]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error ?? "Something went wrong." });
        return;
      }
      setMembers((prev) => {
        const rest = prev.filter((m) => m.userId !== data.userId);
        return [...rest, data].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      setEmail("");
      setMessage({
        kind: "ok",
        text: `${displayName(data)} can now ${data.role === "editor" ? "edit" : "view"} this project.`
      });
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (member: Member, next: "viewer" | "editor") => {
    if (!member.email || next === member.role) return;
    setRemoving(member.userId);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, role: next }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.userId === member.userId ? { ...m, role: next } : m)),
        );
      } else {
        const data = await res.json();
        setMessage({ kind: "error", text: data.error ?? "Something went wrong." });
      }
    } finally {
      setRemoving(null);
    }
  };

  const remove = async (targetUserId: string) => {
    setRemoving(targetUserId);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${targetUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (targetUserId === userId) {
          router.push("/projects");
          router.refresh();
          return;
        }
        setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
      } else {
        const data = await res.json();
        setMessage({ kind: "error", text: data.error ?? "Something went wrong." });
      }
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs text-zinc-400">Loading team…</p>
      </div>
    );
  }

  const selfRow = members.find((m) => m.userId === userId);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Who has access
        </h3>
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {owner && (
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                  {displayName(owner)}
                </p>
                <p className="text-[11px] text-zinc-400">Project owner</p>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                owner
              </span>
            </li>
          )}
          {members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                  {displayName(member)}
                  {member.userId === userId && (
                    <span className="text-zinc-400"> (you)</span>
                  )}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {member.role === "editor" ? "Can edit and manage versions" : "Can view"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isOwner ? (
                  <>
                    <select
                      aria-label={`Role for ${displayName(member)}`}
                      value={member.role}
                      disabled={removing === member.userId}
                      onChange={(e) => void changeRole(member, e.target.value as "viewer" | "editor")}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      <option value="viewer">viewer</option>
                      <option value="editor">editor</option>
                    </select>
                    <button
                      type="button"
                      disabled={removing === member.userId}
                      onClick={() => void remove(member.userId)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {member.role}
                  </span>
                )}
              </div>
            </li>
          ))}
          {members.length === 0 && (
            <li className="py-2.5 text-xs text-zinc-400">
              Only the owner has access — invite someone below.
            </li>
          )}
        </ul>
        {!isOwner && selfRow && (
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              disabled={removing === userId}
              onClick={() => void remove(userId)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            >
              Leave this project
            </button>
          </div>
        )}
      </div>

      {isOwner &&
        (isPro === false ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5 text-center dark:border-zinc-700 dark:bg-zinc-800/40">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Team sharing is a Pro feature
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Upgrade to invite viewers and editors to &ldquo;{projectName}&rdquo; —
              they get access without changing its visibility.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              See Pro plans
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => void invite(e)}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Invite a collaborator
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              They need a ChromaBrew account with this email. Viewers read the
              project; editors also save config and manage versions.
            </p>
            {message && (
              <p
                className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                  message.kind === "error"
                    ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {message.text}
                {message.kind === "error" && message.text.includes("Pro feature") && (
                  <>
                    {" "}
                    <Link href="/pricing" className="font-medium underline underline-offset-4">
                      See Pro plans
                    </Link>
                  </>
                )}
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@studio.com"
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <select
                aria-label="Role for the invitee"
                value={role}
                onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="viewer">Viewer — can view</option>
                <option value="editor">Editor — can edit</option>
              </select>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {saving ? "Inviting…" : "Invite"}
              </button>
            </div>
          </form>
        ))}
    </div>
  );
}
