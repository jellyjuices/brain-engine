import { SparkleIcon } from "@phosphor-icons/react";
import styles from "./report.module.css";
import { Button } from "@/components/button/button.tsx";
import { Markdown } from "@/components/markdown/markdown.tsx";
import { Panel } from "@/components/panel/panel.tsx";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { useSummary } from "@/hooks/use-summary.ts";
import { copy } from "@/content/index.ts";

export function ReportSummary({ markdown, path }: { markdown: string; path: string }) {
  const { busy, summary, failed, run } = useSummary(markdown);

  if (summary) {
    return (
      <div className={styles.reportSummary}>
        <SectionHeader title={copy.report.summary} />
        <Panel>
          <Markdown src={summary} path={path} />
        </Panel>
      </div>
    );
  }
  return (
    <div className={styles.reportSummary}>
      <Button variant="secondary" icon={SparkleIcon} block busy={busy} onClick={() => void run()}>
        {copy.report.summarize}
      </Button>
      {failed && <p className={styles.reportNote}>{copy.report.summaryFailed}</p>}
    </div>
  );
}
