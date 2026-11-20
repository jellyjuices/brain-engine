import styles from "./toolbar.module.css";
import type { ReactNode } from "react";

export function Toolbar({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.toolbar}>
      {meta}
      <div className={styles.toolbarTools} role="toolbar" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
