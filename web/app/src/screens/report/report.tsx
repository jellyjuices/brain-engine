import { Empty } from "@/components/empty/empty.tsx";
import { Markdown } from "@/components/markdown/markdown.tsx";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { useCanSummarize } from "@/hooks/use-can-summarize.ts";
import { useReport } from "@/hooks/use-report.ts";
import { useRoute } from "@/hooks/use-route.ts";
import { copy } from "@/content/index.ts";
import { ReportSummary } from "./report-summary.tsx";

const REPORT_PATH = ".reports/report.md";

export function ReportScreen() {
  const { rest } = useRoute();
  const name = rest || "today";
  const report = useReport(name);
  const canSummarize = useCanSummarize("key-points");

  return (
    <>
      <ScreenHead title={copy.nav.report} fallback="/brain" />
      {report?.kind === "offline" && (
        <Empty title={copy.report.offlineTitle} body={copy.report.offlineBody} />
      )}
      {report?.kind === "missing" && (
        <Empty title={copy.report.missingTitle} body={copy.report.missingBody} />
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
