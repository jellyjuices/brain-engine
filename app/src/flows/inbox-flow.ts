import { pickNote } from "@/components/picker-sheet/picker-sheet.tsx";
import { sortSheet } from "@/components/sort-sheet/sort-sheet.tsx";
import { inboxText } from "@/lib/notes/capture.ts";
import { bestHome } from "@/lib/notes/home-guess.ts";
import { SUBJECT_TYPES } from "@/lib/notes/types.ts";
import { inboxSheet, type InboxStep } from "@/components/inbox-sheet/inbox-sheet.tsx";
import { noteHref, type StoredNote } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";
import { queueInboxDrop, queueSort } from "@/lib/sync/writes.ts";
import { saveFlow } from "./save-flow.ts";
import { copy } from "@/content/index.ts";

export async function openInboxItem(item: StoredNote, start?: InboxStep): Promise<void> {
  const r = await inboxSheet(item, start);
  if (!r) return;
  if (r.kind === "open") {
    go(noteHref(item.path));
    return;
  }
  if (r.kind === "sort")
    await saveFlow(() => queueSort(item.path, r.into, r.when), copy.toast.sorted, true);
  else await saveFlow(() => queueInboxDrop(item.path), copy.toast.archived, true);
}

export function archiveInboxItem(
  item: StoredNote,
  collapse: () => Promise<void>,
): Promise<boolean> {
  return saveFlow(
    async () => {
      await collapse();
      return queueInboxDrop(item.path);
    },
    { message: copy.toast.archived, tone: "deleted" },
    true,
  );
}

export async function sortCapture(item: StoredNote, notes: StoredNote[]): Promise<void> {
  const text = inboxText(item);
  const guess = bestHome(notes, text);
  const choice = await sortSheet(text, guess);
  if (!choice) return;
  const into =
    choice === "guess" && guess
      ? guess
      : await pickNote(copy.sort.pickSubject, (n) => SUBJECT_TYPES.includes(n.type ?? ""));
  if (!into) return;
  await saveFlow(
    () => queueSort(item.path, into.path, "someday"),
    copy.sort.addedTo(into.title),
    true,
  );
}
