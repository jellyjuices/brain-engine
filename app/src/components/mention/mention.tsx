import styles from "./mention.module.css";
import type { ReactNode } from "react";

export function Mention({ name, href }: { name: ReactNode; href?: string }) {
  if (href)
    return (
      <a className={styles.mention} href={href}>
        @{name}
      </a>
    );
  return <span className={styles.mention}>@{name}</span>;
}
