import type { ReactNode } from "react";
import styles from "./card.module.css";

export function CardSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.cardSection}>
      <h3 className={styles.sectionLabel}>{label}</h3>
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}
