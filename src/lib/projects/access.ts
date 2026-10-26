/**
 * Project access — one decision every project route shares.
 *
 * Three levels, in order: the owner (full control), editors (save config and
 * manage versions), viewers (read, including private projects). Anything else
 * is `null`, and `null` sees only public projects. Membership, visibility and
 * deletion stay owner-only — an editor who could make a project public could
 * publish someone else's work, and one who could delete members could lock
 * the owner out of their own sharing settings.
 *
 * Pure: takes rows (or their shapes), never queries. Routes load the project
 * plus the caller's membership row and ask here, so the rule is tested
 * without a database.
 */

/** What the caller may do, from most to least powerful. */
export type ProjectAccess = "owner" | "editor" | "viewer";

/** Collaborator roles as stored on the membership row. */
export type ProjectMemberRole = "editor" | "viewer";

const LEVELS: Record<ProjectAccess, number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

/** True when `access` is at least the level required. */
export function accessAtLeast(
  access: ProjectAccess | null,
  required: ProjectAccess,
): boolean {
  if (access === null) return false;
  return LEVELS[access] >= LEVELS[required];
}

export interface AccessInput {
  /** The project's owner id. */
  ownerId: string;
  /** The signed-in user, or null/undefined when signed out. */
  userId: string | null | undefined;
  /** The caller's membership role, or null when they are not a member. */
  memberRole: ProjectMemberRole | null;
}

/**
 * Resolve the caller's level: owner wins over any membership row, a member
 * gets their role, everyone else gets nothing (public visibility is a
 * separate check in `canView`, not a level — anonymous readers are not
 * "viewers").
 */
export function resolveProjectAccess(input: AccessInput): ProjectAccess | null {
  if (!input.userId) return null;
  if (input.userId === input.ownerId) return "owner";
  return input.memberRole;
}

/**
 * Who may read: members and the owner always (even when private), anyone
 * else only when the project is public.
 */
export function canViewProject(
  visibility: "private" | "public",
  access: ProjectAccess | null,
): boolean {
  if (access !== null) return true;
  return visibility === "public";
}

/** Who may save config and manage versions: owner and editors. */
export function canEditProject(access: ProjectAccess | null): boolean {
  return accessAtLeast(access, "editor");
}

/** Who may change settings, members, visibility, or delete: owner only. */
export function canManageProject(access: ProjectAccess | null): boolean {
  return access === "owner";
}

/** Fields a non-owner editor is allowed to change via PATCH. */
export const EDITOR_PATCH_FIELDS = ["config"] as const;
