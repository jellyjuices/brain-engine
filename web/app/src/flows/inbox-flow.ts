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
    await saveFlow(() => queueSort(item.path, r.into, r.when), copy.save.sorted, true);
  else await saveFlow(() => queueInboxDrop(item.path), copy.save.archived, true);
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
    copy.save.archived,
    true,
  );
}
