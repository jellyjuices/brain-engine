import type { NotesState } from "@/lib/sync/notes-state.ts";
import { EmptyState } from "./empty-state.tsx";

export function NotesEmptyState({ state, onRetry }: { state: NotesState; onRetry: () => void }) {
  if (state === "ready") return null;
  if (state === "error") return <EmptyState kind="error" onRetry={onRetry} />;
  return <EmptyState kind={state} />;
}
