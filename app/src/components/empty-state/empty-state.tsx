import styles from "./empty-state.module.css";
import clsx from "clsx";
import type { Size } from "@/components/button/button.tsx";

export interface EmptyStateProps {
  title: string;
  body?: string;
  size?: Exclude<Size, "lg">;
}

export function EmptyState({ title, body, size = "md" }: EmptyStateProps) {
  return (
    <div className={clsx(styles.empty, size === "sm" && styles.small)}>
      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
    </div>
  );
}
