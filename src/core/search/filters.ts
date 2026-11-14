import type { DatabaseSync } from "node:sqlite";

export interface Filters {
  type?: string;
  tag?: string;
  area?: string;
  status?: string;
  folder?: string;
  limit?: number;
  all?: boolean;
}

export interface NoteRow {
  path: string;
  summary: string;
  folder: string;
}

function where(f: Filters, alias = "n"): { sql: string; args: (string | number)[] } {
  const parts: string[] = [];
  const args: (string | number)[] = [];
  if (f.type) { parts.push(`lower(${alias}.type) = lower(?)`); args.push(f.type); }
  if (f.tag) { parts.push(`${alias}.tags LIKE ?`); args.push(`% ${f.tag} %`); }
  if (f.area) { parts.push(`(${alias}.area = ? OR ${alias}.area LIKE ? OR ${alias}.tags LIKE ? OR ${alias}.path = ?)`); args.push(f.area, `% ${f.area} %`, `% ${f.area} %`, `areas/${f.area}.md`); }
  if (f.status) { parts.push(`${alias}.status = ?`); args.push(f.status); }
  if (f.folder) { parts.push(`${alias}.folder = ?`); args.push(f.folder); }
  if (!f.all && f.folder !== ".archive") parts.push(`NOT (${alias}.folder = '.archive' AND ${alias}.type = 'Capture')`);
  return { sql: parts.length ? " AND " + parts.join(" AND ") : "", args };
}

export function allowedNotes(db: DatabaseSync, f: Filters): Map<string, NoteRow> {
  const clause = where(f);
  const rows = db.prepare(`SELECT path, summary, folder FROM notes n WHERE 1=1${clause.sql}`).all(...clause.args) as unknown as NoteRow[];
  return new Map(rows.map((row) => [row.path, row]));
}

export function recentNotes(db: DatabaseSync, f: Filters, limit: number): NoteRow[] {
  const clause = where(f);
  return db.prepare(`SELECT path, summary, folder FROM notes n WHERE 1=1${clause.sql} ORDER BY (n.folder = '.archive'), mtime DESC LIMIT ?`).all(...clause.args, limit) as unknown as NoteRow[];
}
