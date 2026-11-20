import { go } from "@/lib/platform/router.ts";
import { noteAfterSync } from "./build-flow.ts";
import { dropHeldFile, holdFile, type PendingFile } from "./pending-file.ts";
import { noteHref, type StoredNote } from "@/lib/notes/model.ts";
import { toast } from "@/components/toast/toast-store.ts";
import { pickNote } from "@/components/picker-sheet/picker-sheet.tsx";
import { queueFile, queueJournal } from "@/lib/sync/writes.ts";
import type { JournalPayload } from "@/lib/sync/write-payloads.ts";
import { saveFlow } from "./save-flow.ts";
import { copy } from "@/content/index.ts";

const MAX_FILE_BYTES = 60 * 1024;

function fileTitle(name: string): string {
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
    toast(copy.toast.fileEmpty, { tone: "error" });
    return;
  }
  holdFile({ title: fileTitle(file.name), text });
  go("/file");
}

export async function saveFile(held: PendingFile, asks: string[]): Promise<void> {
  const ok = await saveFlow(
    () => queueFile(held.title, held.text, asks),
    copy.sort.fileAddedTo(held.title),
  );
  if (!ok) return;
  dropHeldFile();
  const made = await noteAfterSync(
    (n) => n.path.startsWith("resources/") && n.title === held.title,
  );
  go(made ? noteHref(made.path) : "/add", true);
}

export function pickAbout(): Promise<StoredNote | null> {
  return pickNote(copy.add.aboutWho, (n) => n.type === "Person" || n.type === "Event");
}

export async function readTextFile(file: File): Promise<string | null> {
  if (file.size > MAX_FILE_BYTES) {
    toast(copy.toast.fileTooBig, { tone: "error" });
    return null;
  }
  return file.text();
}

export function saveJournal(p: JournalPayload): Promise<boolean> {
  return saveFlow(() => queueJournal(p), copy.toast.journalSaved);
}
