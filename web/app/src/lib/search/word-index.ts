import MiniSearch from "minisearch";
import { chunkNote, isJapanese, tokenize, type Entry } from "@shared/search/index.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { noteSource } from "./note-source.ts";

const WORD_LIST_SIZE = 200;
const NAME_BOOST = 2;

interface IndexedNote {
  note: StoredNote;
  source: string;
  ids: string[];
}

export interface WordIndex {
  sync(notes: readonly StoredNote[]): string[];
  words(query: string): string[];
  entries(): Entry[];
  entry(id: string): Entry | undefined;
  note(path: string): StoredNote | undefined;
}

function fuzziness(term: string): number | false {
  const length = [...term].length;
  if (length < 4 || isJapanese(term)) return false;
  return length < 7 ? 1 : 2;
}

function fieldOf(entry: Entry, field: string): string {
  if (field === "id") return entry.id;
  if (field === "names")
    return entry.kind === "card" ? [entry.title, ...entry.names].join(" ") : "";
  return entry.embedText;
}

function newMiniSearch(): MiniSearch<Entry> {
  return new MiniSearch<Entry>({
    fields: ["embedText", "names"],
    extractField: fieldOf,
    tokenize: (text) => tokenize(text),
    searchOptions: {
      prefix: true,
      fuzzy: fuzziness,
      boost: { names: NAME_BOOST },
    },
  });
}

export function createWordIndex(): WordIndex {
  const mini = newMiniSearch();
  const byId = new Map<string, Entry>();
  const byPath = new Map<string, IndexedNote>();

  function drop(path: string) {
    for (const id of byPath.get(path)?.ids ?? []) {
      mini.discard(id);
      byId.delete(id);
    }
    byPath.delete(path);
  }

  function put(note: StoredNote, source: string) {
    drop(note.path);
    const entries = chunkNote(note.path, source);
    mini.addAll(entries);
    for (const entry of entries) byId.set(entry.id, entry);
    byPath.set(note.path, { note, source, ids: entries.map((entry) => entry.id) });
  }

  function syncOne(note: StoredNote): boolean {
    const known = byPath.get(note.path);
    if (known?.note === note) return false;
    const source = noteSource(note);
    if (known?.source === source) {
      known.note = note;
      return false;
    }
    put(note, source);
    return true;
  }

  return {
    sync(notes) {
      const changed = notes.filter(syncOne).map((note) => note.path);
      const present = new Set(notes.map((note) => note.path));
      const gone = [...byPath.keys()].filter((path) => !present.has(path));
      gone.forEach(drop);
      return [...changed, ...gone];
    },
    words(query) {
      return mini
        .search(query)
        .slice(0, WORD_LIST_SIZE)
        .map((result) => String(result.id));
    },
    entries() {
      return [...byId.values()];
    },
    entry(id) {
      return byId.get(id);
    },
    note(path) {
      return byPath.get(path)?.note;
    },
  };
}
