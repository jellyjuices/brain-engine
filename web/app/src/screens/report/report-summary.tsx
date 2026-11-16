import { SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/button.tsx";
import { Markdown } from "@/components/markdown/markdown.tsx";
import { Panel } from "@/components/panel/panel.tsx";
import { useSummary } from "@/hooks/use-summary.ts";
import { copy } from "@/content/index.ts";

export function ReportSummary({ markdown, path }: { markdown: string; path: string }) {
  const { busy, summary, failed, run } = useSummary(markdown);

  if (summary) {
    return (
      <div className="report-summary">
        <p className="section-label">{copy.report.summary}</p>
        <Panel>
          <Markdown src={summary} path={path} />
        </Panel>
      </div>
    );
  }
  return (
    <div className="report-summary">
      <Button variant="secondary" icon={SparkleIcon} block busy={busy} onClick={() => void run()}>
        {copy.report.summarize}
      </Button>
      {failed && <p className="report-note">{copy.report.summaryFailed}</p>}
    </div>
  );
}
