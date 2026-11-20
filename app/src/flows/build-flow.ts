import type { StoredNote } from "@/lib/notes/model.ts";
import { allNotes } from "@/lib/storage/store.ts";
import { enqueueAll } from "@/lib/sync/outbox-batch.ts";
import { queueRelation } from "@/lib/sync/relation-writes.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { saveFlow } from "./save-flow.ts";
import { copy } from "@/content/index.ts";

export async function noteAfterSync(match: (n: StoredNote) => boolean): Promise<StoredNote | null> {
  await syncNow();
  return (await allNotes()).find(match) ?? null;
}

export function addRelations(pairs: [string, string][], placeName: string): Promise<boolean> {
  if (pairs.length === 0) return Promise.resolve(true);
  return saveFlow(
    () =>
      enqueueAll(
        pairs.map(
          ([from, to]) =>
            () =>
              queueRelation(from, to),
        ),
      ),
    copy.sort.addedTo(placeName),
  );
}
