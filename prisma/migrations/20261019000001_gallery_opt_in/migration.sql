-- Chromabrew Gallery — community opt-in on Project.
--
-- Listing in the community gallery is an explicit choice on top of public
-- visibility: a project shared privately with a link must never appear in
-- the gallery by accident. Nullable-free boolean, default false, so every
-- existing project keeps its current (unlisted) behavior.

SET search_path TO chromabrew;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "listedInGallery" BOOLEAN NOT NULL DEFAULT false;
