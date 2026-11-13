import { useEffect, useState } from "react";
import { loadSyncState, onSyncChange, syncState, type SyncState } from "@/lib/sync/sync.ts";

export function useSyncState(): Readonly<SyncState> {
  const [state, setState] = useState(() => ({ ...syncState() }));
  useEffect(() => {
    let alive = true;
    function read() {
      if (alive) setState({ ...syncState() });
    }
    void loadSyncState().then(read);
    const stop = onSyncChange(read);
    return () => {
      alive = false;
      stop();
    };
  }, []);
  return state;
}
