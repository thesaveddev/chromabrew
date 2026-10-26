import { notFound } from "next/navigation";

import { ScanProgress } from "@/components/audit/scan-progress";
import { ScanReport } from "@/components/audit/scan-report";
import { ScanTimeline } from "@/components/audit/scan-timeline";
import { ShareScanButton } from "@/components/audit/share-scan-button";
import { getScanResultsDto } from "@/lib/audit/queries";
import { isReportReady, type ScanStatusId } from "@/lib/audit/types";

export const dynamic = "force-dynamic";

/**
 * The owner's view of one scan.
 *
 * While the job is still running the page shows real progress; once the report
 * exists it shows the report — the screenshot, the findings and the coverage
 * panel — with the share control above it. The progress view refreshes the page
 * when the scan reaches a terminal state, so the two never both appear and a
 * finished scan stops polling.
 */
export default async function ScanPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const results = await getScanResultsDto(scanId);
  if (!results) notFound();

  const ready = isReportReady(results.scan.status as ScanStatusId);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {ready ? (
          <>
            <ShareScanButton scanId={scanId} />
            <ScanReport results={results} />
            {/* Owner-only: history, regression and watches hide themselves
                for anonymous scans and other people's links. */}
            <ScanTimeline scanId={scanId} siteUrl={results.scan.normalizedUrl} />
          </>
        ) : (
          <ScanProgress scanId={scanId} refreshOnFinish />
        )}
      </div>
    </div>
  );
}
