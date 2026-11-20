import type { StoredNote } from "@/lib/notes/model.ts";
import { allNotes } from "@/lib/storage/store.ts";
import { enqueueAll } from "@/lib/sync/outbox-batch.ts";
import { queueRelation } from "@/lib/sync/relation-writes.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { queuePerson, queueSubject } from "@/lib/sync/writes.ts";
import { BUILD_TYPE, type BuildKind } from "@/lib/notes/build-kinds.ts";
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

export function saveSubject(kind: BuildKind, name: string, birthday?: string): Promise<boolean> {
  const where = { person: copy.sort.people, place: copy.sort.places, thing: copy.sort.things }[
    kind
  ];
  return saveFlow(() => {
    if (kind === "person") return queuePerson(name, birthday);
    return queueSubject(kind === "place" ? "Place" : "Thing", name);
  }, copy.sort.addedTo(where));
}

export function findSubject(kind: BuildKind, name: string): Promise<StoredNote | null> {
  const lower = name.toLowerCase();
  return noteAfterSync((n) => n.type === BUILD_TYPE[kind] && n.title.toLowerCase() === lower);
}

export function linkKnown(path: string, subjects: StoredNote[]): Promise<boolean> {
  return addRelations(
    subjects.map((s) => [path, s.path]),
    subjects.map((s) => s.title).join(", "),
  );
}

export function linkNotes(path: string, from: string[], name: string): Promise<boolean> {
  return addRelations(
    from.map((f) => [f, path]),
    name,
  );
}
