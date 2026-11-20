import { hashText } from "./hash.ts";
import type { Entry, EntryKind, NoteHead } from "./types.ts";

export interface Draft {
  kind: EntryKind;
  key: string;
  date: string | null;
  done: boolean | null;
  line: number;
  text: string;
  embedText: string;
}

const NUL = "\u0000";

function contentHash(entry: Omit<Entry, "id" | "hash" | "line">): string {
  const done = entry.done === null ? "" : String(entry.done);
  return hashText([entry.kind, entry.subject, entry.title, entry.names.join("|"), entry.date ?? "", done, entry.text, entry.embedText].join(NUL));
}

export function toEntries(path: string, head: NoteHead, drafts: Draft[]): Entry[] {
  const seen = new Map<string, number>();
  return drafts.map((draft) => {
    const slot = [draft.kind, draft.key].join(NUL);
    const occurrence = seen.get(slot) ?? 0;
    seen.set(slot, occurrence + 1);
    const id = hashText([path, slot, String(occurrence)].join(NUL));
    const names = draft.kind === "card" ? head.names : [];
    const body = { kind: draft.kind, subject: path, title: head.title, names, date: draft.date, done: draft.done, text: draft.text, embedText: draft.embedText };
    return { id, hash: contentHash(body), ...body, line: draft.line };
  });
}
