import { useNotes } from "@/hooks/use-notes.ts";
import { useOutboxItems } from "@/hooks/use-outbox-items.ts";
import { inboxItems } from "@/lib/notes/capture.ts";

export function useUnsortedCount(): number {
  const notes = useNotes();
  const sending = useOutboxItems().filter((item) => item.kind === "inbox");
  return (notes ? inboxItems(notes).length : 0) + sending.length;
}
