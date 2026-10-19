-- Chromabrew Audit — screenshot bytes on ScannedPage.
--
-- The worker captures screenshots on its own host while the web tier runs
-- elsewhere (Vercel), so a PNG the worker writes to its local disk is never
-- visible to the route that serves it. Storing the bytes on the page row
-- makes the screenshot follow the database both tiers already share; the
-- filesystem copy stays as a worker-local fallback. Nullable, so every
-- existing scan keeps NULL, which means "no captured image".

SET search_path TO chromabrew;

-- AlterTable
ALTER TABLE "ScannedPage" ADD COLUMN "screenshotData" BYTEA;
