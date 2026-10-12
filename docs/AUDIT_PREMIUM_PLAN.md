# Chromabrew Premium - Stage 0 Implementation Plan

**Product:** Chromabrew Audit - Website design intelligence, accessibility auditing and design optimization  
**Status:** Stage 0 planning note. Stages 1 and 2 are implemented — see
`docs/AUDIT_ARCHITECTURE.md`, which supersedes this document as the architecture
record.  
**Parent:** Chromabrew (existing design system generator)  
**Approach:** Incremental, evidence-based, preserving existing free tools

---

## 1. Current State Analysis

### 1.1 Tech Stack (Confirmed)
- **Framework:** Next.js 16.3.2 (App Router), React 19, TypeScript
- **Database:** PostgreSQL with Prisma ORM (adapter-pg), schema in `chromabrew` schema
- **Auth:** Auth.js (next-auth v5) with GitHub/Google OAuth + credentials
- **Payments:** Stripe (checkout, portal, webhook) - already integrated
- **Testing:** Vitest (unit/integration, 113 tests passing), Playwright (E2E, browsers installed)
- **Styling:** Tailwind CSS v4
- **Analytics:** Vercel Analytics
- **Existing deps:** axe-core 4.13.0 installed; Playwright 1.62.1 installed (no puppeteer)

### 1.2 Existing Architecture Strengths
- **Deterministic design system engine** (`src/lib/design-system/`) - pure functions, well-tested, canonical `DesignSystem` model
- **Export adapters pattern** - clean registry-based system, easy to extend
- **Project system** - Projects, ProjectVersions with auth, public sharing (`/p/[id]`)
- **Entitlements** - free/pro gating with server/client separation
- **Tools architecture** - registry in `src/lib/tools.ts`, consistent UI via `ToolShell`
- **API patterns** - RESTful route handlers with proper auth/validation

### 1.3 Gaps for Website Audit Feature
- No browser automation/crawling infrastructure
- No job queue for long-running scans
- No scan data models (Scan, Finding, etc.)
- No SSRF protection for outbound URL requests
- No screenshot capture/storage
- No axe-core integration in application code (only installed as dep)

---

## 2. Integration Points

### 2.1 Preserve Existing Functionality
- All existing `/tools/*` must remain independent and functional
- Design system generator (`/design-system`) unchanged in core logic
- Auth, projects, billing continue to work as-is
- No breaking changes to existing APIs

### 2.2 New Routes
- `/audit` or `/analyze` - URL submission landing (main entry for premium audit)
- `/audit/[scanId]` - Report dashboard
- `/audit/[scanId]/findings/[findingId]` - Finding detail view
- API routes under `/api/audit/*`

---

## 3. Data Model (Prisma Schema Additions)

Add new models to `prisma/schema.prisma` under `chromabrew` schema:

```prisma
enum ScanStatus {
  queued
  running
  completed
  partially_completed
  failed
  cancelled
  @@schema("chromabrew")
}

enum ScanScope {
  single_page
  homepage_plus_pages
  selected_pages
  @@schema("chromabrew")
}

enum FindingSeverity {
  critical
  high
  medium
  low
  informational
  @@schema("chromabrew")
}

enum FindingCategory {
  color_contrast
  accessibility
  visual_design
  design_system
  technical
  metadata
  @@schema("chromabrew")
}

enum DetectionMethod {
  deterministic
  ai_assisted
  hybrid
  @@schema("chromabrew")
}

enum PreviewMethod {
  annotated_original
  illustrative_proposal
  rendered_change
  @@schema("chromabrew")
}

model Scan {
  id                String        @id @default(cuid())
  url               String        @db.Text
  normalizedUrl     String        @db.Text
  status            ScanStatus    @default(queued)
  scope             ScanScope     @default(single_page)
  viewportWidth     Int           @default(1280)
  viewportHeight    Int           @default(720)
  pagesScanned      Int           @default(0)
  pagesTotal        Int           @default(0)
  pagesFailed       Int           @default(0)
  errorMessage      String?       @db.Text
  startedAt         DateTime?
  completedAt       DateTime?
  durationMs        Int?
  userAgent         String?       @db.Text
  ipHash            String?       @db.Text
  rulesVersion      String        @default("1.0.0")
  scannerVersion    String        @default("1.0.0")
  aiModel           String?
  metadata          Json?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  userId            String?
  user              User?         @relation(fields: [userId], references: [id])
  scannedPages      ScannedPage[]
  findings          Finding[]
  previews          Preview[]
  reports           Report[]

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@schema("chromabrew")
}

model ScannedPage {
  id                String        @id @default(cuid())
  url               String        @db.Text
  title             String?       @db.Text
  statusCode        Int?
  loadTimeMs        Int?
  rendered          Boolean       @default(false)
  screenshotPath    String?       @db.Text
  screenshotUrl     String?       @db.Text
  domHash           String?
  metadata          Json?
  errorMessage      String?       @db.Text
  createdAt         DateTime      @default(now())

  scanId            String
  scan              Scan          @relation(fields: [scanId], references: [id], onDelete: Cascade)
  findings          Finding[]

  @@index([scanId])
  @@schema("chromabrew")
}

model Finding {
  id                String              @id @default(cuid())
  ruleId            String
  category          FindingCategory
  severity          FindingSeverity
  title             String              @db.Text
  description       String              @db.Text
  explanation       String?             @db.Text
  whyMatters        String?             @db.Text
  recommendation    String?             @db.Text
  implementation    String?             @db.Text
  cssSuggestion     String?             @db.Text
  tokenSuggestion   Json?
  evidence          Json?
  elementSelector   String?             @db.Text
  xpath             String?             @db.Text
  originalValues    Json?
  suggestedValues   Json?
  wcagCriterion     String?
  detectionMethod   DetectionMethod     @default(deterministic)
  confidence        Decimal?            @db.Decimal(3,2)
  verificationStatus String             @default("unverified")
  isDuplicate       Boolean             @default(false)
  duplicateGroupId  String?
  resolved          Boolean             @default(false)
  resolvedAt        DateTime?
  ignored           Boolean             @default(false)
  ignoredAt         DateTime?
  userFeedback      String?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  scanId            String
  scan              Scan                @relation(fields: [scanId], references: [id], onDelete: Cascade)
  pageId            String?
  page              ScannedPage?        @relation(fields: [pageId], references: [id])
  proposedFix       ProposedFix?
  previews          Preview[]

  @@index([scanId])
  @@index([category, severity])
  @@index([ruleId])
  @@schema("chromabrew")
}

model ProposedFix {
  id                String        @id @default(cuid())
  title             String        @db.Text
  description       String?       @db.Text
  originalValues    Json?
  proposedValues    Json?
  cssChanges        String?       @db.Text
  tokenChanges      Json?
  contrastBefore    Decimal?      @db.Decimal(4,2)
  contrastAfter     Decimal?      @db.Decimal(4,2)
  passesWcag        Boolean?
  validated         Boolean       @default(false)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  findingId         String        @unique
  finding           Finding       @relation(fields: [findingId], references: [id], onDelete: Cascade)

  @@schema("chromabrew")
}

model Preview {
  id                String          @id @default(cuid())
  method            PreviewMethod
  imagePath         String?         @db.Text
  imageUrl          String?         @db.Text
  htmlContent       String?         @db.Text
  cssContent        String?         @db.Text
  viewportWidth     Int?
  viewportHeight    Int?
  description       String?         @db.Text
  isVerified        Boolean         @default(false)
  createdAt         DateTime        @default(now())

  scanId            String
  scan              Scan            @relation(fields: [scanId], references: [id], onDelete: Cascade)
  findingId         String?
  finding           Finding?        @relation(fields: [findingId], references: [id])

  @@index([scanId])
  @@schema("chromabrew")
}

model Report {
  id                String        @id @default(cuid())
  format            String        @default("pdf")
  filePath          String?       @db.Text
  fileUrl           String?       @db.Text
  generatedAt       DateTime      @default(now())
  expiresAt         DateTime?
  downloadCount     Int           @default(0)

  scanId            String
  scan              Scan          @relation(fields: [scanId], references: [id], onDelete: Cascade)

  @@index([scanId])
  @@schema("chromabrew")
}
```

Also add `scans` relation to `User` model.

---

## 4. Security Design (Critical)

### 4.1 SSRF Protection
Must treat all URLs as untrusted. Implement comprehensive checks in URL validation layer:

1. **Protocol allowlist**: Only `http:` and `https:`
2. **Private IP blocking**: Block RFC1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), loopback (127.0.0.0/8, ::1), link-local, multicast
3. **Cloud metadata**: Block 169.254.169.254 (AWS/Azure/GCP)
4. **Special addresses**: 0.0.0.0, localhost variants
5. **DNS resolution**: Resolve hostname to IPs and recheck before request; re-validate after redirects
6. **Redirect validation**: Follow redirects but validate each destination
7. **Domain allowlist/blocklist**: Configurable for abuse prevention

### 4.2 Browser Isolation
- Use Playwright with isolated browser contexts per scan
- Disable features: geolocation, camera, microphone, notifications
- Block non-essential requests (analytics, trackers) if desired
- Resource limits: max pages, max depth, timeout per page (30-60s), total scan timeout (5-10 min)
- Network interception to block dangerous requests

### 4.3 Rate Limiting & Abuse
- Per-IP and per-user rate limits on scan creation
- Quotas based on entitlements (free vs pro)
- Queue depth limits
- Max pages per scan (start: 1-5 pages, expand later)

---

## 5. Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Browser automation | **Playwright** | Already installed, cross-browser, reliable, good API, headless |
| Accessibility engine | **axe-core 4.13.0** | Already installed, industry standard, deterministic, structured results |
| Crawling | Custom (Playwright) | Start simple, control depth/limits, avoid heavy crawler deps |
| Job queue | In-process/DB-backed | Simple for MVP; can move to BullMQ/Redis later if needed |
| Screenshots | Playwright screenshots | Full page or viewport, PNG |
| AI | Provider-agnostic abstraction | Keep flexible (existing heuristic AI in codebase shows pattern) |
| Report generation | PDF via Playwright/puppeteer-core style or html-to-pdf | HTML report first, PDF export later |
| Storage | Local filesystem initially (screenshots) | Or object storage (S3/Cloudflare R2) for production |

---

## 6. Implementation Stages (Mapped to Spec)

### Stage 0 (This Phase) - ✅ Planning
- [x] Repo audit (understand structure)
- [ ] Create comprehensive plan document (this doc)
- [ ] Define data models, APIs, security

### Stage 1 - Premium interface & single-page scan foundation
**Frontend:**
- Create `/audit` landing page (URL input, scope, viewport, progress)
- Create `/audit/[scanId]` report shell
- Create scan components following existing UI patterns

**Backend:**
- Add Prisma models (Scan, ScannedPage, Finding, ProposedFix, Preview, Report)
- Create `/api/audit/scan` POST (create scan job)
- Create `/api/audit/scan/[scanId]/status` GET
- Create `/api/audit/scan/[scanId]/results` GET
- Implement URL validation + SSRF protection
- Basic job queue (in-memory/DB polling) for background processing
- Browser worker using Playwright (single-page first)

**Acceptance:** Submit URL → scan runs → status updates → results stored

### Stage 2 - Deterministic analysis engine ✅
- [x] Page rendering + screenshot capture (`browser.ts`, `screenshot-store.ts`, screenshot route)
- [x] DOM extraction + computed styles (rendered DOM, computed colours and font metrics)
- [x] axe-core integration (run axe on rendered page, map results to Finding model)
- [x] Color contrast calculations (leverage existing `contrast.ts` from design-system lib)
- [x] Metadata checks (title, meta, alt text, viewport) — the native rules run against the rendered DOM
- [x] Link extraction, deduplication (bounded inventory stored on the scanned page for Stage 6)
- [x] Evidence attachment to findings (selectors, measured values, sample selectors, axe node snippets)
- [x] DetectionMethod = 'deterministic'

**Acceptance:** Trustworthy, reproducible findings with evidence — verified against live
pages: two independent scans of the same URL produce identical findings, and every
gap (an engine that did not run, text that could not be measured) is reported as a
gap rather than as a pass. See `docs/AUDIT_ARCHITECTURE.md` for the implementation
and the bundler pitfall that had to be fixed for axe-core to run at all.

### Stage 3 - AI visual design analysis

The Phase 1 audit for this stage is done and recorded in
`docs/AUDIT_ARCHITECTURE.md` under *Existing AI integrations*: the repository
contains **no provider integration and no model credentials**, and the only
feature labelled "AI" (`/api/ai/palette-suggestion`) is a keyword-to-hue lookup
with a string hash behind it. There is therefore nothing to reuse, and per the
brief no AI feature may be reported as implemented until a real provider is
configured and tested end to end.

- Schema-validated AI output
- Distinguish objective vs subjective
- Deduplicate against deterministic findings
- Confidence + verification labels
- Provider-agnostic abstraction

### Stage 4 - Actionable fixes & design-system generation
- Color alternatives with validated contrast (use `fixContrast`)
- Token suggestions
- CSS examples
- Link fixes back to findings

### Stage 5 - Before/after previews
- Annotated screenshots
- Three preview methods (annotated/illustrative/rendered)
- Clear labeling

### Stage 6 - Multi-page crawling
- Link discovery, depth limits, deduplication
- Site-wide consolidation

### Stage 7 - Reports, accounts, billing
- PDF/HTML reports
- Entitlements integration (free vs pro limits)
- Usage metering

### Stage 8 - Historical comparisons & monitoring
- Scan snapshots, diffing

---

## 7. First Viable Cut (MVP for Stage 1+2)

Minimal working path:
1. Single-page scan only (scope: single_page)
2. Deterministic checks only (axe-core + contrast via existing lib)
3. Basic report showing findings with severity, evidence, explanation
4. No AI, no previews, no multi-page initially
5. Auth optional for free trial? Or require auth - follow existing patterns

This keeps scope manageable while delivering core value.

---

## 8. Next Steps

**Immediate action (Stage 0 completion):**
1. Create Prisma migration for new models
2. Add new types/types to lib
3. Create SSRF protection utilities
4. Create browser worker utilities (Playwright wrapper)
5. Implement Stage 1 incrementally with tests

**Critical:** Follow incremental approach - test each piece, preserve existing tests (all 113 must still pass).

---

## 9. File Structure Additions

```
src/
  app/
    audit/
      page.tsx (landing)
      [scanId]/
        page.tsx (report)
        findings/[findingId]/page.tsx
    api/audit/
      scan/route.ts
      scan/[scanId]/status/route.ts
      scan/[scanId]/results/route.ts
  lib/
    audit/
      url-validator.ts (SSRF protection)
      browser-worker.ts (Playwright)
      axe-analyzer.ts (axe-core integration)
      contrast-analyzer.ts (leverage existing)
      finding-mapper.ts
      job-queue.ts
  components/
    audit/
      url-form.tsx
      scan-progress.tsx
      findings-list.tsx
      finding-detail.tsx
      report-summary.tsx
  workers/ (or lib/workers) - background job processing
```
