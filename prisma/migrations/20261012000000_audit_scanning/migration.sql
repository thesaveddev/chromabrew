-- Chromabrew Audit schema — the delta from the committed schema to the Stage 1
-- audit models. Generated with:
--
--   npx prisma migrate diff --from-schema <pre-audit schema> --to-schema prisma/schema.prisma --script
--
-- The statements below are deliberately unqualified: Prisma sets the search path
-- itself when it pushes a schema. Run this file in ONE session so the SET below
-- still applies, e.g.
--
--   psql "$DATABASE_URL" -f prisma/audit-migration.sql
--
-- or, for a development database, just let Prisma do it:
--
--   npx prisma db push
--

SET search_path TO chromabrew;

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('queued', 'running', 'completed', 'partially_completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ScanScope" AS ENUM ('single_page', 'homepage_plus_pages', 'selected_pages');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('critical', 'high', 'medium', 'low', 'informational');

-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('color_contrast', 'accessibility', 'visual_design', 'design_system', 'technical', 'metadata');

-- CreateEnum
CREATE TYPE "DetectionMethod" AS ENUM ('deterministic', 'ai_assisted', 'hybrid');

-- CreateEnum
CREATE TYPE "PreviewMethod" AS ENUM ('annotated_original', 'illustrative_proposal', 'rendered_change');

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'queued',
    "scope" "ScanScope" NOT NULL DEFAULT 'single_page',
    "viewportWidth" INTEGER NOT NULL DEFAULT 1280,
    "viewportHeight" INTEGER NOT NULL DEFAULT 720,
    "pagesScanned" INTEGER NOT NULL DEFAULT 0,
    "pagesTotal" INTEGER NOT NULL DEFAULT 0,
    "pagesFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "rulesVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "scannerVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "aiModel" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScannedPage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "statusCode" INTEGER,
    "loadTimeMs" INTEGER,
    "rendered" BOOLEAN NOT NULL DEFAULT false,
    "screenshotPath" TEXT,
    "screenshotUrl" TEXT,
    "domHash" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanId" TEXT NOT NULL,

    CONSTRAINT "ScannedPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "explanation" TEXT,
    "whyMatters" TEXT,
    "recommendation" TEXT,
    "implementation" TEXT,
    "cssSuggestion" TEXT,
    "tokenSuggestion" JSONB,
    "evidence" JSONB,
    "elementSelector" TEXT,
    "xpath" TEXT,
    "originalValues" JSONB,
    "suggestedValues" JSONB,
    "wcagCriterion" TEXT,
    "detectionMethod" "DetectionMethod" NOT NULL DEFAULT 'deterministic',
    "confidence" DECIMAL(3,2),
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateGroupId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "ignoredAt" TIMESTAMP(3),
    "userFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scanId" TEXT NOT NULL,
    "pageId" TEXT,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedFix" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "originalValues" JSONB,
    "proposedValues" JSONB,
    "cssChanges" TEXT,
    "tokenChanges" JSONB,
    "contrastBefore" DECIMAL(4,2),
    "contrastAfter" DECIMAL(4,2),
    "passesWcag" BOOLEAN,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "findingId" TEXT NOT NULL,

    CONSTRAINT "ProposedFix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preview" (
    "id" TEXT NOT NULL,
    "method" "PreviewMethod" NOT NULL,
    "imagePath" TEXT,
    "imageUrl" TEXT,
    "htmlContent" TEXT,
    "cssContent" TEXT,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "description" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanId" TEXT NOT NULL,
    "findingId" TEXT,

    CONSTRAINT "Preview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "filePath" TEXT,
    "fileUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "scanId" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_userId_idx" ON "Scan"("userId");

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- CreateIndex
CREATE INDEX "ScannedPage_scanId_idx" ON "ScannedPage"("scanId");

-- CreateIndex
CREATE INDEX "Finding_scanId_idx" ON "Finding"("scanId");

-- CreateIndex
CREATE INDEX "Finding_category_severity_idx" ON "Finding"("category", "severity");

-- CreateIndex
CREATE INDEX "Finding_ruleId_idx" ON "Finding"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposedFix_findingId_key" ON "ProposedFix"("findingId");

-- CreateIndex
CREATE INDEX "Preview_scanId_idx" ON "Preview"("scanId");

-- CreateIndex
CREATE INDEX "Report_scanId_idx" ON "Report"("scanId");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannedPage" ADD CONSTRAINT "ScannedPage_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ScannedPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedFix" ADD CONSTRAINT "ProposedFix_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preview" ADD CONSTRAINT "Preview_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preview" ADD CONSTRAINT "Preview_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

