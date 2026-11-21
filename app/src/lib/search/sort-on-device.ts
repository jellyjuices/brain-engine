import { rank, type Entry } from "@shared/search/index.ts";
import {
  guessHome,
  namesOf,
  sortWords,
  type SortGuess,
  type SortSubject,
} from "@shared/sort/index.ts";
import { isLive, type StoredNote } from "@/lib/notes/model.ts";
import { SUBJECT_TYPES } from "@/lib/notes/types.ts";
import { syncDeviceIndex } from "./find-on-device.ts";

function aliasesOf(note: StoredNote): string[] {
  const aliases = note.meta.aliases;
  return Array.isArray(aliases)
    ? aliases.filter((alias): alias is string => typeof alias === "string")
    : [];
}

function toSortSubject(note: StoredNote): SortSubject {
  return { path: note.path, type: note.type ?? "", title: note.title, aliases: aliasesOf(note) };
}

export function deviceSubjects(notes: readonly StoredNote[]): SortSubject[] {
  return notes
    .filter((note) => SUBJECT_TYPES.includes(note.type ?? "") && isLive(note))
    .map(toSortSubject);
}

function longNamesOnly(subject: SortSubject, minName: number): SortSubject {
  const aliases = namesOf(subject).filter((name) => name.length >= minName);
  return { path: subject.path, type: subject.type, title: "", aliases };
}

export function sortOnDevice(
  text: string,
  notes: readonly StoredNote[],
  minName?: number,
): SortGuess {
  const words = sortWords(text);
  const index = syncDeviceIndex(notes);
  const ids = words.length ? index.words(words.join(" ")) : [];
  const entries = ids
    .map((id) => index.entry(id))
    .filter((entry): entry is Entry => entry !== undefined);
  const subjects = deviceSubjects(notes);
  const named = minName ? subjects.map((s) => longNamesOnly(s, minName)) : subjects;
  return guessHome(text, named, rank(text, entries, [ids]));
}
