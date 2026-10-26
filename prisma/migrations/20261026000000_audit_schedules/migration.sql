-- Chromabrew Audit — scheduled whole-site re-scans.
--
-- One row per watched site per user (see src/lib/audit/schedules.ts): the
-- worker enqueues a fresh scan whenever nextRunAt passes, then advances it by
-- intervalDays. Schedules need a signed-in owner, so userId is a plain string
-- rather than a relation — the id alone is what every query filters on.
--
--   psql "$DATABASE_URL" -f prisma/migrations/20261026000000_audit_schedules/migration.sql
--
-- or, for a development database, just let Prisma do it:
--
--   npx prisma db push
--
-- This is additive and safe against a database that already holds the audit
-- schema: it creates one empty table and touches no existing row. No scan is
-- ever scheduled by the migration itself, so existing behaviour is unchanged
-- until a user creates their first schedule.

SET search_path TO chromabrew;

-- CreateTable
CREATE TABLE "AuditSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "scope" "ScanScope" NOT NULL DEFAULT 'homepage_plus_pages',
    "viewportId" TEXT NOT NULL DEFAULT 'desktop',
    "intervalDays" INTEGER NOT NULL DEFAULT 7,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "lastScanId" TEXT,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditSchedule_active_nextRunAt_idx" ON "AuditSchedule"("active", "nextRunAt");

-- CreateIndex
CREATE INDEX "AuditSchedule_userId_idx" ON "AuditSchedule"("userId");
