import styles from "./sync-status.module.css";
import clsx from "clsx";
import { useSyncState } from "@/hooks/use-sync-state.ts";
import { syncText } from "@/lib/sync/sync-text.ts";

export function SyncStatus() {
  const state = useSyncState();
  return (
    <p className={clsx(styles.syncStatus, state.offline && styles.isOffline)} aria-live="polite">
      {syncText(state)}
    </p>
  );
}
