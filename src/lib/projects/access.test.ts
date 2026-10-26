import { describe, expect, it } from "vitest";
import {
  accessAtLeast,
  canEditProject,
  canManageProject,
  canViewProject,
  resolveProjectAccess,
} from "./access";

describe("resolveProjectAccess", () => {
  it("returns null when signed out, even for public projects", () => {
    expect(
      resolveProjectAccess({ ownerId: "o", userId: null, memberRole: null }),
    ).toBeNull();
    expect(
      resolveProjectAccess({ ownerId: "o", userId: undefined, memberRole: "editor" }),
    ).toBeNull();
  });

  it("owner wins over any membership row", () => {
    expect(
      resolveProjectAccess({ ownerId: "o", userId: "o", memberRole: "viewer" }),
    ).toBe("owner");
  });

  it("members get their role, strangers get nothing", () => {
    expect(
      resolveProjectAccess({ ownerId: "o", userId: "m", memberRole: "editor" }),
    ).toBe("editor");
    expect(
      resolveProjectAccess({ ownerId: "o", userId: "m", memberRole: "viewer" }),
    ).toBe("viewer");
    expect(
      resolveProjectAccess({ ownerId: "o", userId: "s", memberRole: null }),
    ).toBeNull();
  });
});

describe("capabilities", () => {
  it("viewing: members always, strangers only when public", () => {
    expect(canViewProject("private", "viewer")).toBe(true);
    expect(canViewProject("private", "editor")).toBe(true);
    expect(canViewProject("private", "owner")).toBe(true);
    expect(canViewProject("private", null)).toBe(false);
    expect(canViewProject("public", null)).toBe(true);
  });

  it("editing is owner + editor; managing is owner only", () => {
    expect(canEditProject("editor")).toBe(true);
    expect(canEditProject("owner")).toBe(true);
    expect(canEditProject("viewer")).toBe(false);
    expect(canEditProject(null)).toBe(false);
    expect(canManageProject("owner")).toBe(true);
    expect(canManageProject("editor")).toBe(false);
  });

  it("levels order owner > editor > viewer", () => {
    expect(accessAtLeast("viewer", "viewer")).toBe(true);
    expect(accessAtLeast("viewer", "editor")).toBe(false);
    expect(accessAtLeast("editor", "viewer")).toBe(true);
    expect(accessAtLeast(null, "viewer")).toBe(false);
  });
});
