import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { Markdown } from "@/components/markdown/markdown.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { useCanSummarize } from "@/hooks/use-can-summarize.ts";
import { useReport } from "@/hooks/use-report.ts";
import { useRoute } from "@/hooks/use-route.ts";
import { copy } from "@/content/index.ts";
import { ReportSummary } from "./report-summary.tsx";

const REPORT_PATH = ".reports/report.md";

export function ReportScreen() {
  const { rest } = useRoute();
  const name = rest || "today";
  const { report, retry } = useReport(name);
  const canSummarize = useCanSummarize("key-points");

  return (
    <>
      <PageHeader title={copy.nav.report} fallback="/brain" />
      {!report && <EmptyState kind="loading" what={copy.report.what} />}
      {report?.kind === "offline" && (
        <EmptyState
          kind="offline"
          title={copy.report.offlineTitle}
          body={copy.report.offlineBody}
        />
      )}
      {report?.kind === "error" && (
        <EmptyState kind="error" what={copy.report.what} onRetry={retry} />
      )}
      {report?.kind === "missing" && (
        <EmptyState title={copy.report.missingTitle} body={copy.report.missingBody} />
      )}
      {report?.kind === "ready" && (
        <>
          {canSummarize && (
            <ReportSummary key={name} markdown={report.markdown} path={REPORT_PATH} />
          )}
          <Markdown src={report.markdown} path={REPORT_PATH} />
        </>
      )}
    </>
  );
}
