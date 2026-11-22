import type { SyncState } from "./sync.ts";

export type NotesState = "loading" | "offline" | "error" | "ready";

export function notesState(count: number | null, sync: Readonly<SyncState>): NotesState {
  if (count === null) return "loading";
  if (count > 0) return "ready";
  if (sync.offline) return "offline";
  if (sync.failed) return "error";
  if (sync.syncing && !sync.lastSync) return "loading";
  return "ready";
}
