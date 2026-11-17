import styles from "./panel.module.css";
import type { ReactNode } from "react";

export function Panel({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className={styles.panel} aria-label={label}>
      {children}
    </section>
  );
}
