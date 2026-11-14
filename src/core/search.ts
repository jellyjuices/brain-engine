// The search index: a SQLite full-text index in .brain/index.db.
// It is a cache. Delete it any time; `brain index --full` rebuilds it from the files.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { loopsIn } from "../todos/todos.ts";
import { relationsIn } from "./relations.ts";
import { descOf, type Note, str, summary, type Summary, tagsOf, titleOf, typeOf } from "./notes.ts";
import { loadAll, notePaths, readNote, statMtime } from "./files.ts";

export interface Hit extends Summary {
  snippet: string;
  score: number;
}

export interface Filters {
  type?: string;
  tag?: string;
  area?: string;
  status?: string;
  folder?: string;
  limit?: number;
  /** Also show archived captures (intake answers, sweeps). Their text already lives in subject notes. */
  all?: boolean;
}

const INDEX_VERSION = 3;
const FTS_TABLE = `CREATE VIRTUAL TABLE IF NOT EXISTS fts USING fts5(
      path UNINDEXED, title, names, description, tags, body, tokenize = 'unicode61 remove_diacritics 2'
    )`;

export function openIndex(root: string): DatabaseSync {
  mkdirSync(join(root, ".brain"), { recursive: true });
  const db = new DatabaseSync(join(root, ".brain", "index.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      path TEXT PRIMARY KEY, mtime REAL, type TEXT, title TEXT, description TEXT,
      tags TEXT, area TEXT, status TEXT, folder TEXT, summary TEXT
    );
    ${FTS_TABLE};
    CREATE TABLE IF NOT EXISTS relations (
      "from" TEXT, "to" TEXT, role TEXT, heading TEXT, time TEXT
    );
    CREATE INDEX IF NOT EXISTS relations_from ON relations("from");
    CREATE INDEX IF NOT EXISTS relations_to ON relations("to");
    CREATE TABLE IF NOT EXISTS todo_subjects (
      path TEXT, text TEXT, done INTEGER, subject TEXT
    );
    CREATE INDEX IF NOT EXISTS todo_subjects_subject ON todo_subjects(subject);
  `);
  return db;
}

function forget(db: DatabaseSync, path: string) {
  for (const sql of ["DELETE FROM notes WHERE path = ?", "DELETE FROM fts WHERE path = ?", 'DELETE FROM relations WHERE "from" = ?', "DELETE FROM todo_subjects WHERE path = ?"]) db.prepare(sql).run(path);
}

function put(db: DatabaseSync, n: Note) {
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
  db.prepare("INSERT INTO fts (path, title, names, description, tags, body) VALUES (?,?,?,?,?,?)").run(n.path, titleOf(n), namesOf(n).join(" "), descOf(n), tagsOf(n).join(" "), n.body);
}

/** Other names for a note: the words in its file name (people/omar-haddad.md → omar haddad) and any `aliases`. */
function namesOf(n: { path: string; meta: Record<string, unknown> }): string[] {
  const slug = (n.path.split("/").pop() ?? "").replace(/\.md$/, "").replace(/-/g, " ");
  const raw = n.meta.aliases;
  const aliases = Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? [raw] : [];
  return [slug, ...aliases];
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * How well the query names this note: 0 = exact title or name, 1 = title or name starts with it,
 * 2 = a word in the title or name starts with it, 3 = only found in the text.
 * Reason: when the owner types a name, they want that note first, not every note that mentions it.
 */
export function nameTier(q: string, title: string, names: string[]): number {
  const want = norm(q);
  if (!want) return 3;
  const all = [title, ...names].map(norm);
  if (all.some((s) => s === want)) return 0;
  if (all.some((s) => s.startsWith(want))) return 1;
  if (all.some((s) => ` ${s}`.includes(` ${want}`))) return 2;
  return 3;
}

/** Bring the index up to date. Only changed files are read unless full is true. */
export function updateIndex(root: string, full = false): { added: number; updated: number; removed: number; total: number } {
  const db = openIndex(root);
  try {
    // Version 2 adds relations and to-do subjects. An older index is rebuilt once so they are filled for every note.
    const version = (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;
    if (version < INDEX_VERSION) {
      // Version 3 adds the names column, so the full-text table is made again.
      full = true;
      db.exec(`DROP TABLE IF EXISTS fts; ${FTS_TABLE}; PRAGMA user_version = ${INDEX_VERSION}`);
    }
    if (full) db.exec("DELETE FROM notes; DELETE FROM fts; DELETE FROM relations; DELETE FROM todo_subjects;");
    const known = new Map<string, number>();
    for (const r of db.prepare("SELECT path, mtime FROM notes").all() as { path: string; mtime: number }[]) known.set(r.path, r.mtime);
    const paths = notePaths(root);
    let added = 0, updated = 0, removed = 0;
    db.exec("BEGIN");
    for (const rel of paths) {
      const mtime = statMtime(root, rel);
      const was = known.get(rel);
      known.delete(rel);
      if (was === mtime) continue;
      put(db, readNote(root, rel));
      if (was === undefined) added++;
      else updated++;
    }
    for (const gone of known.keys()) {
      forget(db, gone);
      removed++;
    }
    db.exec("COMMIT");
    return { added, updated, removed, total: paths.length };
  } finally {
    db.close();
  }
}

/** Turn plain words into a safe FTS5 query: every word must match, the last one as a prefix. */
export function ftsQuery(q: string): string {
  const words = q.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.map((w, i) => `"${w}"${i === words.length - 1 ? "*" : ""}`).join(" ");
}

function where(f: Filters, alias = "n"): { sql: string; args: (string | number)[] } {
  const parts: string[] = [];
  const args: (string | number)[] = [];
  if (f.type) { parts.push(`lower(${alias}.type) = lower(?)`); args.push(f.type); }
  if (f.tag) { parts.push(`${alias}.tags LIKE ?`); args.push(`% ${f.tag} %`); }
  if (f.area) { parts.push(`(${alias}.area = ? OR ${alias}.tags LIKE ? OR ${alias}.path = ?)`); args.push(f.area, `% ${f.area} %`, `areas/${f.area}.md`); }
  if (f.status) { parts.push(`${alias}.status = ?`); args.push(f.status); }
  if (f.folder) { parts.push(`${alias}.folder = ?`); args.push(f.folder); }
  // Raw material is hidden by default: a filed capture is a copy of text that now lives in a subject note.
  if (!f.all && f.folder !== ".archive") parts.push(`NOT (${alias}.folder = '.archive' AND ${alias}.type = 'Capture')`);
  return { sql: parts.length ? " AND " + parts.join(" AND ") : "", args };
}

export function search(root: string, q: string, f: Filters = {}): Hit[] {
  updateIndex(root);
  const db = openIndex(root);
  try {
    const limit = f.limit ?? 20;
    const clause = where(f);
    const match = ftsQuery(q);
    if (!match) {
      const rows = db.prepare(`SELECT summary FROM notes n WHERE 1=1${clause.sql} ORDER BY (n.folder = '.archive'), mtime DESC LIMIT ?`).all(...clause.args, limit) as { summary: string }[];
      return rows.map((r) => ({ ...(JSON.parse(r.summary) as Summary), snippet: "", score: 0 }));
    }
    const rows = db
      .prepare(
        `SELECT n.summary AS summary, fts.names AS names, n.folder AS folder, snippet(fts, 5, '[', ']', ' … ', 12) AS snippet,
                bm25(fts, 0, 10.0, 8.0, 4.0, 3.0, 1.0) AS score
         FROM fts JOIN notes n ON n.path = fts.path
         WHERE fts MATCH ?${clause.sql} ORDER BY (n.folder = '.archive'), score LIMIT ?`,
      )
      .all(match, ...clause.args, Math.max(limit * 5, 100)) as { summary: string; names: string; folder: string; snippet: string; score: number }[];
    // Rank by name first (exact, then starts with), then by text score. Archived notes stay last.
    return rows
      .map((r) => {
        const s = JSON.parse(r.summary) as Summary;
        return { hit: { ...s, snippet: r.snippet.includes("[") ? r.snippet.replace(/\s+/g, " ").trim() : "", score: r.score }, archived: r.folder === ".archive" ? 1 : 0, tier: nameTier(q, s.title, [r.names]) };
      })
      .sort((a, b) => a.archived - b.archived || a.tier - b.tier || a.hit.score - b.hit.score)
      .slice(0, limit)
      .map((x) => x.hit);
  } finally {
    db.close();
  }
}

/** All notes that match the filters, from the files (no index needed). */
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
