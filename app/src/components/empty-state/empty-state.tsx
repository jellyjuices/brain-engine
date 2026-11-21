import styles from "./empty-state.module.css";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { Size } from "@/components/button/button.tsx";

export interface EmptyStateProps {
  title: string;
  body?: string;
  size?: Exclude<Size, "lg">;
  action?: ReactNode;
}

export function EmptyState({ title, body, size = "md", action }: EmptyStateProps) {
  return (
    <div className={clsx(styles.empty, size === "sm" && styles.small)}>
      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
