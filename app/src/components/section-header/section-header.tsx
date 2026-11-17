import styles from "./section-header.module.css";
import clsx from "clsx";
import type { ReactNode } from "react";

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
  <div className={clsx(styles.sectionHeader, tone === "late" && styles.isLate)}>
    <Heading className={styles.title}>
      {text}
      {count !== undefined && <span className={styles.countBadge}>{count}</span>}
    </Heading>
    {action && <div className={styles.actionBox}>{action}</div>}
  </div>
);
