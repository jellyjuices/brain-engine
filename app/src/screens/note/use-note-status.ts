import { useEffect, useState } from "react";
import { getConflict, onConflictChange, type Conflict } from "@/lib/sync/conflict.ts";
import { onOutboxChange } from "@/lib/sync/outbox.ts";
import { hasPendingEdit } from "@/lib/sync/writes.ts";

export interface NoteStatus {
  loaded: boolean;
  conflict?: Conflict;
  waiting: boolean;
}

export function useNoteStatus(path: string): NoteStatus {
  const [status, setStatus] = useState<NoteStatus>({ loaded: false, waiting: false });
  useEffect(() => {
    let alive = true;
    async function load() {
      const [conflict, waiting] = await Promise.all([getConflict(path), hasPendingEdit(path)]);
      if (alive) setStatus({ loaded: true, conflict: conflict ?? undefined, waiting });
    }
    void load();
    const stops = [onConflictChange(() => void load()), onOutboxChange(() => void load())];
    return () => {
      alive = false;
      stops.forEach((stop) => stop());
    };
  }, [path]);
  return status;
}
