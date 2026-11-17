import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const INDEX_VERSION = 4;

const TABLES = `
  CREATE TABLE IF NOT EXISTS notes (
    path TEXT PRIMARY KEY, mtime REAL, type TEXT, title TEXT, description TEXT,
    tags TEXT, area TEXT, status TEXT, folder TEXT, summary TEXT
  );
  CREATE TABLE IF NOT EXISTS relations (
    "from" TEXT, "to" TEXT, role TEXT, heading TEXT, time TEXT
  );
  CREATE INDEX IF NOT EXISTS relations_from ON relations("from");
  CREATE INDEX IF NOT EXISTS relations_to ON relations("to");
  CREATE TABLE IF NOT EXISTS todo_subjects (
    path TEXT, text TEXT, done INTEGER, subject TEXT
  );
  CREATE INDEX IF NOT EXISTS todo_subjects_subject ON todo_subjects(subject);
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY, hash TEXT, kind TEXT, path TEXT, title TEXT, names TEXT, tags TEXT,
    date TEXT, done INTEGER, line INTEGER, text TEXT, embed TEXT
  );
  CREATE INDEX IF NOT EXISTS entries_path ON entries(path);
  CREATE VIRTUAL TABLE IF NOT EXISTS words USING fts5(
    id UNINDEXED, names, text, tokenize = 'unicode61 remove_diacritics 2'
  );
  CREATE VIRTUAL TABLE IF NOT EXISTS strings USING fts5(
    id UNINDEXED, text, tokenize = 'trigram remove_diacritics 1'
  );
  CREATE TABLE IF NOT EXISTS vectors (
    id TEXT, hash TEXT, model TEXT, vec BLOB, at REAL, PRIMARY KEY (id, model)
  );
`;

function addVectorTime(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(vectors)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "at")) db.exec("ALTER TABLE vectors ADD COLUMN at REAL");
}

const CLEAR = ["notes", "relations", "todo_subjects", "entries", "words", "strings", "vectors"].map((table) => `DELETE FROM ${table};`).join(" ");

export function openIndex(root: string): DatabaseSync {
  mkdirSync(join(root, ".brain"), { recursive: true });
  const db = new DatabaseSync(join(root, ".brain", "index.db"));
  db.exec(TABLES);
  addVectorTime(db);
  return db;
}

export function prepareIndex(db: DatabaseSync, full: boolean): boolean {
  const version = (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;
  const stale = version < INDEX_VERSION;
  if (stale) db.exec(`DROP TABLE IF EXISTS fts; PRAGMA user_version = ${INDEX_VERSION};`);
  if (stale || full) db.exec(CLEAR);
  return stale || full;
}
