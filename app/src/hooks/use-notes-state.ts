import type { StoredNote } from "@/lib/notes/model.ts";
import { notesState, type NotesState } from "@/lib/sync/notes-state.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { useNotes } from "./use-notes.ts";
import { useSyncState } from "./use-sync-state.ts";

export function useNotesState(): {
  notes: StoredNote[] | null;
  state: NotesState;
  retry: () => void;
} {
  const notes = useNotes();
  const sync = useSyncState();
  return {
    notes,
    state: notesState(notes && notes.length, sync),
    retry: () => void syncNow({ full: true }),
  };
}
