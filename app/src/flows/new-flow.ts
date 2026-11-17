import { toast } from "@/components/toast/toast-store.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { queueFile, queueJournal, queuePerson, queueSubject } from "@/lib/sync/writes.ts";
import type { JournalPayload, SubjectPayload } from "@/lib/sync/write-payloads.ts";
import { noteSheet } from "@/components/pick-sheet/pick-sheet.tsx";
import { subjectSheet } from "@/components/subject-sheet/subject-sheet.tsx";
import { personSheet } from "@/components/person-sheet/person-sheet.tsx";
import { saveFlow } from "./save-flow.ts";
import { copy } from "@/content/index.ts";

const MAX_FILE_BYTES = 60 * 1024;

export async function addPersonFlow(): Promise<void> {
  const p = await personSheet();
  if (!p) return;
  await saveFlow(() => queuePerson(p.name, p.birthday), copy.save.added);
}

export function fileTitle(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim() || name
  );
}

export async function addFile(file: File): Promise<void> {
  const text = await readTextFile(file);
  if (text === null) return;
  if (!text.trim()) {
    toast(copy.save.fileEmpty, { tone: "error" });
    return;
  }
  await saveFlow(() => queueFile(fileTitle(file.name), text), copy.save.fileAdded);
}

export async function addSubjectFlow(type: SubjectPayload["type"]): Promise<void> {
  const name = await subjectSheet(type);
  if (!name) return;
  await saveFlow(() => queueSubject(type, name), copy.save.added);
}

export function pickAbout(): Promise<StoredNote | null> {
  return noteSheet(copy.add.aboutWho, (n) => n.type === "Person" || n.type === "Event");
}

export async function readTextFile(file: File): Promise<string | null> {
  if (file.size > MAX_FILE_BYTES) {
    toast(copy.save.fileTooBig, { tone: "error" });
    return null;
  }
  return file.text();
}

export function saveJournal(p: JournalPayload): Promise<boolean> {
  return saveFlow(() => queueJournal(p), copy.save.journalSaved);
}
