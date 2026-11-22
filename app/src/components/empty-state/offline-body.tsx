import { useSyncState } from "@/hooks/use-sync-state.ts";
import { syncTime } from "@/lib/sync/sync-text.ts";
import { copy } from "@/content/index.ts";

export function OfflineBody({ className }: { className?: string }) {
  const { lastSync } = useSyncState();
  const text = lastSync
    ? copy.states.offlineWithCopy(syncTime(lastSync))
    : copy.states.offlineNoCopy;
  return <p className={className}>{text}</p>;
}
