import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  project: { findUnique: vi.fn() },
  projectMember: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  user: { findUnique: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ prisma: db }));

let currentSession: { id: string } | null = { id: "owner-1" };

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(async () => (currentSession ? { user: currentSession } : null)),
}));

vi.mock("@/lib/entitlements-server", () => ({
  hasEntitlement: vi.fn(async () => true),
}));

import { hasEntitlement } from "@/lib/entitlements-server";
import { GET, POST } from "./route";

const CTX = { params: Promise.resolve({ id: "p1" }) };

function post(body: unknown): Request {
  return new Request("http://localhost/api/projects/p1/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function ownedProject() {
  return {
    id: "p1",
    userId: "owner-1",
    visibility: "private",
    members: [],
  };
}

describe("POST /api/projects/[id]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSession = { id: "owner-1" };
    db.project.findUnique.mockResolvedValue(ownedProject());
    db.user.findUnique.mockResolvedValue({ id: "u2", name: "Teammate", email: "team@studio.com" });
    db.projectMember.upsert.mockImplementation(async (args: {
      create: { role: "viewer" | "editor" };
    }) => ({
      role: args.create.role,
      createdAt: new Date(2026, 9, 27),
    }));
    vi.mocked(hasEntitlement).mockResolvedValue(true);
  });

  it("refuses signed-out callers without touching the database", async () => {
    currentSession = null;
    const response = await POST(post({ email: "team@studio.com", role: "viewer" }), CTX);
    expect(response.status).toBe(401);
    expect(db.project.findUnique).not.toHaveBeenCalled();
  });

  it("hides the project from non-owners", async () => {
    currentSession = { id: "stranger" };
    db.project.findUnique.mockResolvedValue({ ...ownedProject(), members: [] });
    const response = await POST(post({ email: "team@studio.com", role: "viewer" }), CTX);
    expect(response.status).toBe(404);
    expect(db.projectMember.upsert).not.toHaveBeenCalled();
  });

  it("refuses free owners with a pro_required code that names the upgrade", async () => {
    vi.mocked(hasEntitlement).mockResolvedValue(false);
    const response = await POST(post({ email: "team@studio.com", role: "viewer" }), CTX);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("pro_required");
    expect(db.projectMember.upsert).not.toHaveBeenCalled();
  });

  it("rejects unknown roles and bad emails before any lookup", async () => {
    const badRole = await POST(post({ email: "team@studio.com", role: "admin" }), CTX);
    expect(badRole.status).toBe(400);
    const badEmail = await POST(post({ email: "not-an-email", role: "viewer" }), CTX);
    expect(badEmail.status).toBe(400);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("says plainly when the email has no account, instead of failing later", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const response = await POST(post({ email: "ghost@studio.com", role: "viewer" }), CTX);
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("no_account");
    expect(db.projectMember.upsert).not.toHaveBeenCalled();
  });

  it("refuses to invite the owner to their own project", async () => {
    db.user.findUnique.mockResolvedValue({ id: "owner-1", name: "Owner", email: "owner@studio.com" });
    const response = await POST(post({ email: "owner@studio.com", role: "viewer" }), CTX);
    expect(response.status).toBe(400);
  });

  it("grants access to the user row on success", async () => {
    const response = await POST(post({ email: "team@studio.com", role: "editor" }), CTX);
    expect(response.status).toBe(201);
    expect(db.projectMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId_userId: { projectId: "p1", userId: "u2" } },
        create: { projectId: "p1", userId: "u2", role: "editor" },
      }),
    );
    expect((await response.json()).role).toBe("editor");
  });
});

describe("GET /api/projects/[id]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSession = { id: "owner-1" };
  });

  it("hides the roster from strangers on private projects", async () => {
    currentSession = { id: "stranger" };
    db.project.findUnique.mockResolvedValue({ ...ownedProject(), members: [] });
    const response = await GET(
      new Request("http://localhost/api/projects/p1/members"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(response.status).toBe(404);
    expect(db.projectMember.findMany).not.toHaveBeenCalled();
  });

  it("lists owner and members for access holders", async () => {
    db.project.findUnique.mockResolvedValue(ownedProject());
    db.user.findUnique.mockResolvedValue({ id: "owner-1", name: "Owner", email: "o@x.com" });
    db.projectMember.findMany.mockResolvedValue([
      {
        role: "editor",
        createdAt: new Date(2026, 9, 27),
        user: { id: "u2", name: "Teammate", email: "team@studio.com" },
      },
    ]);
    const response = await GET(
      new Request("http://localhost/api/projects/p1/members"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.owner.id).toBe("owner-1");
    expect(body.members).toHaveLength(1);
    expect(body.isOwner).toBe(true);
  });
});
