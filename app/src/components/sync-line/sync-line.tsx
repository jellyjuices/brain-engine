import styles from "./sync-line.module.css";
import clsx from "clsx";
import { useSyncState } from "@/hooks/use-sync-state.ts";
import { syncText } from "@/lib/sync/sync-text.ts";

export function SyncLine() {
  const state = useSyncState();
  return (
    <p className={clsx(styles.syncLine, state.offline && styles.isOffline)} aria-live="polite">
      {syncText(state)}
    </p>
  );
}
