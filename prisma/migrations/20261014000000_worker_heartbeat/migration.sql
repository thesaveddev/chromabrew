-- Chromabrew Audit — worker heartbeat.
--
-- What the web tier reads to answer "is there a scanner at all?" before it
-- accepts a URL. The worker and the app share no filesystem and no network path
-- (docs/AUDIT_WORKER_HOST.md), so the database is the only place the question
-- can be asked.
--
--   psql "$DATABASE_URL" -f prisma/migrations/20261014000000_worker_heartbeat/migration.sql
--
-- or, for a development database, just let Prisma do it:
--
--   npx prisma db push
--
-- This is additive and safe against a database that already holds the audit
-- schema: it creates one empty table and touches no existing row. The table
-- starts empty, which reads as "no scanner has checked in" — the honest answer
-- until the worker writes its first beat, and the same answer the form would
-- give if the worker never ran at all.

SET search_path TO chromabrew;

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "workerId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "stoppedAt" TIMESTAMP(3),
    "version" TEXT,
    "host" TEXT,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("workerId")
);

-- CreateIndex
CREATE INDEX "WorkerHeartbeat_lastSeenAt_idx" ON "WorkerHeartbeat"("lastSeenAt");
