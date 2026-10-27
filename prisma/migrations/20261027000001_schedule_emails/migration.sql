-- Chromabrew scheduled reports — emailed recipients on AuditSchedule.
--
-- Emailed reports are a Pro feature on top of watches: a watch with an empty
-- recipient list keeps its current behavior (re-scan silently, compare in the
-- timeline). A JSON text array (max 3 emails, validated in the app) keeps the
-- hand-managed production database free of special types, and the NOT NULL +
-- empty-array default means every existing watch keeps working with no email.

SET search_path TO chromabrew;

-- AlterTable
ALTER TABLE "AuditSchedule" ADD COLUMN "emailRecipients" TEXT NOT NULL DEFAULT '[]';
