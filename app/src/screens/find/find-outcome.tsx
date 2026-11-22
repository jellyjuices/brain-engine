import { NotesEmptyState } from "@/components/empty-state/notes-empty-state.tsx";
import type { StoredNote } from "@/lib/notes/model.ts";
import type { RemoteSearch } from "@/lib/notes/server-search.ts";
import type { NotesState } from "@/lib/sync/notes-state.ts";
import { FindResults } from "./find-results.tsx";

export interface FindOutcomeProps {
  q: string;
  notes: StoredNote[] | null;
  state: NotesState;
  remote: RemoteSearch | null;
  onRetry: () => void;
}

export function FindOutcome({ q, notes, state, remote, onRetry }: FindOutcomeProps) {
  if (!notes) return <NotesEmptyState state="loading" onRetry={onRetry} />;
  if (state !== "ready") return <NotesEmptyState state={state} onRetry={onRetry} />;
  return <FindResults q={q} notes={notes} remote={remote} />;
}
