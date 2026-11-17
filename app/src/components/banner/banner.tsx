import { TrayIcon } from "@phosphor-icons/react";
import { Button } from "../button/button.tsx";
import styles from "./banner.module.css";

export type BannerProps = {
  message: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
};

export function Banner({ message, count, actionLabel, onAction }: BannerProps) {
  return (
    <div className={styles.banner} role="status">
      <TrayIcon aria-hidden className={styles.icon} />
      <p className={styles.message}>
        {count !== undefined && <span className={styles.count}>{count}</span>}
        {message}
      </p>
      {actionLabel && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
