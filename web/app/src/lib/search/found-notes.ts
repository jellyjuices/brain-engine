import type { Hit } from "@shared/search/index.ts";
import { isArchived } from "@/lib/notes/model.ts";
import type { WordIndex } from "./word-index.ts";

const NOTE_LIMIT = 30;
const EXCERPT_LENGTH = 140;

export interface FoundNote {
  path: string;
  title: string;
  type?: string;
  sub: string;
}

function excerpt(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH).trimEnd()} …` : flat;
}

function subOf(hit: Hit, description: string): string {
  return hit.entry.kind === "card" ? description : excerpt(hit.entry.embedText);
}

export function foundNotes(hits: readonly Hit[], index: WordIndex): FoundNote[] {
  const byPath = new Map<string, FoundNote>();
  for (const hit of hits) {
    const path = hit.entry.subject;
    const note = index.note(path);
    if (byPath.has(path) || !note) continue;
    byPath.set(path, {
      path,
      title: note.title,
      ...(note.type && { type: note.type }),
      sub: subOf(hit, note.description),
    });
  }
  const notes = [...byPath.values()];
  const live = notes.filter((note) => !isArchived(note));
  return [...live, ...notes.filter(isArchived)].slice(0, NOTE_LIMIT);
}
