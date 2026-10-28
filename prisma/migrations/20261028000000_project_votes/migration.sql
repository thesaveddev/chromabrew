-- ChromaBrew community gallery votes: the second curation signal.
--
-- One row per (project, voter). Voter identity is `user:<id>` for a signed-in
-- reader and `ip:<hash>` for an anonymous one, so voting needs no account
-- while staying one-per-person. The unique pair makes a re-vote idempotent,
-- and the foreign key cascades so deleting a project removes its votes.

SET search_path TO chromabrew;

-- CreateTable
CREATE TABLE "ProjectVote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectVote_projectId_voterKey_key" ON "ProjectVote"("projectId", "voterKey");
CREATE INDEX "ProjectVote_projectId_idx" ON "ProjectVote"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectVote" ADD CONSTRAINT "ProjectVote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
