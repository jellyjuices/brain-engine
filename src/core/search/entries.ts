import type { DatabaseSync } from "node:sqlite";
import type { Entry } from "../../../shared/search/index.ts";

export interface EntryRow {
  id: string;
  hash: string;
  kind: string;
  path: string;
  title: string;
  names: string;
  tags: string;
  date: string | null;
  done: number | null;
  line: number;
  text: string;
  embed: string;
}

export interface EntryChanges {
  added: number;
  changed: number;
  removed: number;
}

const NAME_SEP = "\n";

function dropEntry(db: DatabaseSync, id: string, tables = ["entries", "words", "strings", "vectors"]) {
  for (const table of tables) db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}

function insertEntry(db: DatabaseSync, path: string, entry: Entry, tags: string) {
  const done = entry.done === null ? null : entry.done ? 1 : 0;
  const names = entry.names.join(NAME_SEP);
  db.prepare("INSERT INTO entries (id, hash, kind, path, title, names, tags, date, done, line, text, embed) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(
    entry.id, entry.hash, entry.kind, path, entry.title, names, tags, entry.date, done, entry.line, entry.text, entry.embedText,
  );
  const words = [...entry.names, tags].filter(Boolean).join(" ");
  db.prepare("INSERT INTO words (id, names, text) VALUES (?,?,?)").run(entry.id, words, entry.text);
  db.prepare("INSERT INTO strings (id, text) VALUES (?,?)").run(entry.id, words ? `${words}\n${entry.text}` : entry.text);
}

export function syncEntries(db: DatabaseSync, path: string, entries: Entry[], noteTags: string[]): EntryChanges {
  const known = new Map<string, { hash: string; tags: string; line: number }>();
  for (const row of db.prepare("SELECT id, hash, tags, line FROM entries WHERE path = ?").all(path) as { id: string; hash: string; tags: string; line: number }[]) known.set(row.id, row);
  const changes: EntryChanges = { added: 0, changed: 0, removed: 0 };
  for (const entry of entries) {
    const tags = entry.kind === "card" ? noteTags.join(" ") : "";
    const was = known.get(entry.id);
    known.delete(entry.id);
    if (was && was.hash === entry.hash && was.tags === tags) {
      if (was.line !== entry.line) db.prepare("UPDATE entries SET line = ? WHERE id = ?").run(entry.line, entry.id);
      continue;
    }
    if (was) {
      dropEntry(db, entry.id, ["entries", "words", "strings"]);
      changes.changed++;
    } else changes.added++;
    insertEntry(db, path, entry, tags);
  }
  for (const gone of known.keys()) {
    dropEntry(db, gone);
    changes.removed++;
  }
  return changes;
}

export function dropEntries(db: DatabaseSync, path: string): number {
  const ids = (db.prepare("SELECT id FROM entries WHERE path = ?").all(path) as { id: string }[]).map((row) => row.id);
  for (const id of ids) dropEntry(db, id);
  return ids.length;
}

export function entriesById(db: DatabaseSync, ids: readonly string[]): EntryRow[] {
  const rows: EntryRow[] = [];
  for (let start = 0; start < ids.length; start += 500) {
    const part = ids.slice(start, start + 500);
    rows.push(...(db.prepare(`SELECT * FROM entries WHERE id IN (${part.map(() => "?").join(",")})`).all(...part) as unknown as EntryRow[]));
  }
  return rows;
}

export function cardRows(db: DatabaseSync): EntryRow[] {
  return db.prepare("SELECT * FROM entries WHERE kind = 'card'").all() as unknown as EntryRow[];
}

export function toEntry(row: EntryRow): Entry {
  return {
    id: row.id, hash: row.hash, kind: row.kind as Entry["kind"], subject: row.path, title: row.title,
    names: row.names ? row.names.split(NAME_SEP) : [], date: row.date, done: row.done === null ? null : row.done === 1,
    line: row.line, text: row.text, embedText: row.embed,
  };
}
