import type { ReactNode } from "react";
import styles from "./subject-card.module.css";

export function SubjectCardSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.cardSection}>
      <h3 className={styles.sectionLabel}>{label}</h3>
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}
