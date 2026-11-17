import type { ReactNode } from "react";
import styles from "./sheet-actions.module.css";

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
