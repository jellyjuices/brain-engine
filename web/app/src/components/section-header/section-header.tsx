import { css } from "@linaria/core";
import clsx from "clsx";
import type { ReactNode } from "react";

const sectionHeader = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-xl) var(--space-lg) var(--space-sm);
`;

const title = css`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-display-md);
  font-weight: var(--font-weight-regular);
  line-height: var(--font-leading-snug);
  color: var(--text-primary);
`;

const isLate = css`
  .${sectionHeader}& .${title} {
    color: var(--status-late);
  }
`;

const countBadge = css`
  display: inline-grid;
  place-items: center;
  min-width: var(--space-xl);
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-control);
  background: var(--background-tag);
  font-family: var(--font-number);
  line-height: var(--font-leading-tight);
  font-size: var(--font-size-body-xs);
  color: var(--text-secondary);
`;

const actionBox = css`
  display: flex;
  align-items: center;
`;

export type SectionHeaderProps = {
  title: string;
  count?: number;
  tone?: "default" | "late";
  action?: ReactNode;
  as?: "h2" | "h3";
};

export const SectionHeader = ({
  title: text,
  count,
  tone = "default",
  action,
  as: Heading = "h2",
}: SectionHeaderProps) => (
  <div className={clsx(sectionHeader, tone === "late" && isLate)}>
    <Heading className={title}>
      {text}
      {count !== undefined && <span className={countBadge}>{count}</span>}
    </Heading>
    {action && <div className={actionBox}>{action}</div>}
  </div>
);
