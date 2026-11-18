import styles from "./tool-bar.module.css";
import type { ReactNode } from "react";

export function ToolBar({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.toolBar}>
      {meta}
      <div className={styles.toolBarTools} role="toolbar" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
