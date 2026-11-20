import { appendToSection } from "@shared/line/index.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { getNote, putNotes } from "@/lib/storage/store.ts";
import { queueBirthday, queueEdit } from "@/lib/sync/writes.ts";
import { pickNote } from "@/components/picker-sheet/picker-sheet.tsx";
import { birthdaySheet } from "@/components/person-sheet/person-sheet.tsx";
import { saveFlow } from "./save-flow.ts";
import { copy } from "@/content/index.ts";

async function freshNote(note: StoredNote): Promise<StoredNote> {
  return (await getNote(note.path)) ?? note;
}

export async function addBirthday(note: StoredNote): Promise<void> {
  const birthday = await birthdaySheet(note.title);
  if (!birthday) return;
  await saveFlow(async () => {
    const fresh = await freshNote(note);
    await putNotes([{ ...fresh, meta: { ...fresh.meta, birthday } }]);
    return queueBirthday(note.path, birthday);
  }, copy.toast.saved);
}

export async function addPartner(note: StoredNote): Promise<void> {
  const firstName = note.title.split(/[\s,]+/)[0] ?? note.title;
  const other = await pickNote(
    copy.notes.whoIsPartner(firstName),
    (n) => n.type === "Person" && n.path !== note.path,
  );
  if (!other) return;
  await saveFlow(async () => {
    const fresh = await freshNote(note);
    const body = appendToSection(
      fresh.body,
      "# People",
      `- [${other.title}](../${other.path}) · partner`,
    );
    await putNotes([{ ...fresh, body }]);
    return queueEdit(note.path, body, note.hash);
  }, copy.toast.saved);
}
