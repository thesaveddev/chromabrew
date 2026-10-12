-- Chromabrew Audit — shareable report links.
--
-- The delta from the Stage 1 audit schema to the two share columns on "Scan".
-- Generated with:
--
--   npx prisma migrate diff --from-schema <schema without the share fields> \
--     --to-schema prisma/schema.prisma --script
--
-- This is safe to run against a database that already holds the audit schema:
-- it adds two nullable columns and one unique index, and rewrites no row. Every
-- existing scan keeps NULL, which means "not shared".
--
--   psql "$DATABASE_URL" -f prisma/share-migration.sql
--
-- or, for a development database, just let Prisma do it:
--
--   npx prisma db push

SET search_path TO chromabrew;

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "Scan" ADD COLUMN "sharedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Scan_shareToken_key" ON "Scan"("shareToken");
