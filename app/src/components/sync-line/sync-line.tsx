import "./sync-line.css";
import clsx from "clsx";
import { useSyncState } from "@/hooks/use-sync-state.ts";
import { syncText } from "@/lib/sync/sync-text.ts";

export function SyncLine() {
  const state = useSyncState();
  return (
    <p className={clsx("sync-line", state.offline && "is-offline")} aria-live="polite">
      {syncText(state)}
    </p>
  );
}
