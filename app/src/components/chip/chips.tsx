import type { ReactNode } from "react";
import styles from "./chips.module.css";

export function Chips({ children }: { children: ReactNode }) {
  return <div className={styles.chips}>{children}</div>;
}
