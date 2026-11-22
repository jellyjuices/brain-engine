import styles from "./sync-status.module.css";
import clsx from "clsx";
import { useSyncState } from "@/hooks/use-sync-state.ts";
import { syncText } from "@/lib/sync/sync-text.ts";
import { copy } from "@/content/index.ts";

export function SyncStatus({ writes }: { writes?: boolean }) {
  const state = useSyncState();
  const text = writes ? (state.offline ? copy.states.offlineWrites : "") : syncText(state);
  if (writes && !text) return null;
  return (
    <p className={clsx(styles.syncStatus, state.offline && styles.isOffline)} aria-live="polite">
      {text}
    </p>
  );
}
