import { css } from "@linaria/core";
import { SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@ds/components/button/button.tsx";
import { Markdown } from "@/components/markdown/markdown.tsx";
import { Panel } from "@/components/panel/panel.tsx";
import { useSummary } from "@/hooks/use-summary.ts";
import { copy } from "@/content/index.ts";

const summaryBox = css`
  display: grid;
  gap: var(--space-lg);
  padding-bottom: var(--space-xl);
`;

const noteText = css`
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
`;

export function ReportSummary({ markdown, path }: { markdown: string; path: string }) {
  const { busy, summary, failed, run } = useSummary(markdown);

  if (summary) {
    return (
      <div className={summaryBox}>
        <p className="section-label">{copy.report.summary}</p>
        <Panel>
          <Markdown src={summary} path={path} />
        </Panel>
      </div>
    );
  }
  return (
    <div className={summaryBox}>
      <Button variant="secondary" icon={<SparkleIcon aria-hidden />} block busy={busy} onClick={() => void run()}>
        {copy.report.summarize}
      </Button>
      {failed && <p className={noteText}>{copy.report.summaryFailed}</p>}
    </div>
  );
}
