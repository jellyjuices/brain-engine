import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { chunkNote } from "../../shared/search/index.ts";
import { loopsIn } from "../todos/todos.ts";
import { relationsIn } from "./relations.ts";
import { descOf, type Note, str, summary, type Summary, tagsOf, titleOf, typeOf } from "./notes.ts";
import { loadAll, notePaths, readNote, statMtime } from "./files.ts";
import { type Embedder, MODEL, queryVector } from "./embed.ts";
import { dropEntries, syncEntries, type EntryChanges } from "./search/entries.ts";
import { recentNotes, type Filters } from "./search/filters.ts";
import { findIn, type FindOptions, type FindResult, type NoteHit } from "./search/fused.ts";
import { openIndex, prepareIndex } from "./search/schema.ts";

export { openIndex } from "./search/schema.ts";
export { ftsQuery } from "./search/lists.ts";
export { nameTier } from "../../shared/search/index.ts";
export type { Filters } from "./search/filters.ts";
export type { FindResult } from "./search/fused.ts";

export type Hit = NoteHit;

export interface IndexResult {
  added: number;
  updated: number;
  removed: number;
  total: number;
  entries: EntryChanges;
}

function forget(db: DatabaseSync, path: string) {
  for (const sql of ["DELETE FROM notes WHERE path = ?", 'DELETE FROM relations WHERE "from" = ?', "DELETE FROM todo_subjects WHERE path = ?"]) db.prepare(sql).run(path);
}

function put(db: DatabaseSync, root: string, n: Note): EntryChanges {
  const noteSummary = summary(n);
  forget(db, n.path);
  for (const rel of relationsIn(n)) {
    db.prepare('INSERT INTO relations ("from", "to", role, heading, time) VALUES (?,?,?,?,?)').run(rel.from, rel.to, rel.role ?? null, rel.heading, rel.time ?? null);
  }
  for (const todo of loopsIn(n)) {
    for (const subject of todo.subjects ?? []) db.prepare("INSERT INTO todo_subjects (path, text, done, subject) VALUES (?,?,?,?)").run(n.path, todo.text, todo.done ? 1 : 0, subject);
  }
  db.prepare(
    "INSERT INTO notes (path, mtime, type, title, description, tags, area, status, folder, summary) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ).run(n.path, n.mtime, typeOf(n) ?? null, titleOf(n), descOf(n), ` ${tagsOf(n).join(" ")} `, str(n.meta.area) ?? null, noteSummary.status, n.path.split("/")[0], JSON.stringify(noteSummary));
  return syncEntries(db, n.path, chunkNote(n.path, readFileSync(join(root, n.path), "utf8")), tagsOf(n));
}

function addChanges(total: EntryChanges, more: EntryChanges) {
  total.added += more.added;
  total.changed += more.changed;
  total.removed += more.removed;
}

export function updateIndex(root: string, full = false): IndexResult {
  const db = openIndex(root);
  try {
    prepareIndex(db, full);
    const known = new Map<string, number>();
    for (const r of db.prepare("SELECT path, mtime FROM notes").all() as { path: string; mtime: number }[]) known.set(r.path, r.mtime);
    const paths = notePaths(root);
    const entries: EntryChanges = { added: 0, changed: 0, removed: 0 };
    let added = 0, updated = 0, removed = 0;
    db.exec("BEGIN");
    for (const rel of paths) {
      const mtime = statMtime(root, rel);
      const was = known.get(rel);
      known.delete(rel);
      if (was === mtime) continue;
      addChanges(entries, put(db, root, readNote(root, rel)));
      if (was === undefined) added++;
      else updated++;
    }
    for (const gone of known.keys()) {
      forget(db, gone);
      entries.removed += dropEntries(db, gone);
      removed++;
    }
    db.exec("COMMIT");
    return { added, updated, removed, total: paths.length, entries };
  } finally {
    db.close();
  }
}

export function findEntries(root: string, q: string, f: Filters = {}, opts: Partial<FindOptions> = {}): FindResult {
  updateIndex(root);
  const db = openIndex(root);
  try {
    if (!q.trim()) {
      const notes = recentNotes(db, f, f.limit ?? 20).map((r) => ({ ...(JSON.parse(r.summary) as Summary), snippet: "", score: 0 }));
      return { hits: [], answer: null, notes, meaning: "off" };
    }
    return findIn(db, q, f, { model: opts.model ?? MODEL, queryVector: opts.queryVector ?? null });
  } finally {
    db.close();
  }
}

export async function find(root: string, q: string, f: Filters = {}, embedder: Embedder | null = null): Promise<FindResult> {
  const vector = await queryVector(embedder, q);
  return findEntries(root, q, f, { model: embedder?.model, queryVector: vector });
}

export function search(root: string, q: string, f: Filters = {}): Hit[] {
  return findEntries(root, q, f).notes;
}

export function list(root: string, f: Filters = {}): Summary[] {
  return loadAll(root)
    .map(summary)
    .filter((s) => !f.type || s.type?.toLowerCase() === f.type.toLowerCase())
    .filter((s) => !f.tag || s.tags.includes(f.tag))
    .filter((s) => !f.area || s.area === f.area || s.tags.includes(f.area) || s.path === `areas/${f.area}.md`)
    .filter((s) => !f.status || s.status === f.status)
    .filter((s) => !f.folder || s.path.startsWith(f.folder + "/"))
    .sort((a, b) => b.modified.localeCompare(a.modified) || a.title.localeCompare(b.title))
    .slice(0, f.limit ?? Infinity);
}
