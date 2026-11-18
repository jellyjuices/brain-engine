import styles from "./empty.module.css";
import clsx from "clsx";
import type { Size } from "@/components/button/button.tsx";

export interface EmptyProps {
  title: string;
  body?: string;
  size?: Exclude<Size, "lg">;
}

export function Empty({ title, body, size = "md" }: EmptyProps) {
  return (
    <div className={clsx(styles.empty, size === "sm" && styles.small)}>
      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
    </div>
  );
}
