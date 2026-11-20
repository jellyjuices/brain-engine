import { guessHome, type SortGuess, type SortSubject } from "../../shared/sort/index.ts";
import { DIRS, folderOf, type Note, str, titleOf, typeOf } from "../core/notes.ts";
import type { Embedder } from "../core/embed.ts";
import { sortHits } from "./hits.ts";

const ENDED = ["done", "cancelled"];

export function isLiveSubject(note: Note): boolean {
  if (folderOf(note) === DIRS.archive || str(note.meta.status) === "deprecated") return false;
  return !(typeOf(note) === "Event" && ENDED.includes(String(note.meta.status)));
}

export function toSortSubject(note: Note): SortSubject {
  const aliases = Array.isArray(note.meta.aliases) ? note.meta.aliases.map(String) : [];
  return { path: note.path, type: typeOf(note) ?? "", title: titleOf(note), aliases };
}

export function sortSubjects(notes: readonly Note[]): SortSubject[] {
  return notes.filter(isLiveSubject).map(toSortSubject);
}

export async function guessFor(root: string, notes: readonly Note[], text: string, embedder: Embedder | null = null): Promise<SortGuess> {
  return guessHome(text, sortSubjects(notes), await sortHits(root, text, embedder));
}
