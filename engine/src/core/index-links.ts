import type { Relation } from "./relations.ts";
import { openIndex, updateIndex } from "./search.ts";

/** Relations both ways: lines in this note (out) and lines in other notes that point here (in). */
export function relationsOf(root: string, path: string): { out: Relation[]; in: Relation[] } {
  updateIndex(root);
  const db = openIndex(root);
  try {
    const rows = (sql: string) => (db.prepare(sql).all(path) as Record<string, string | null>[]).map((r) => {
      const rel: Relation = { from: r.from!, to: r.to!, heading: r.heading! };
      if (r.role) rel.role = r.role;
      if (r.time) rel.time = r.time;
      return rel;
    });
    return {
      out: rows('SELECT * FROM relations WHERE "from" = ? ORDER BY rowid'),
      in: rows('SELECT * FROM relations WHERE "to" = ? ORDER BY "from", rowid'),
    };
  } finally {
    db.close();
  }
}

/** To-dos in other notes that name this subject with `· with` or `· re`. */
export function todosNaming(root: string, path: string, opts: { done?: boolean } = {}): { path: string; text: string; done: boolean }[] {
  updateIndex(root);
  const db = openIndex(root);
  try {
    const rows = db.prepare("SELECT path, text, done FROM todo_subjects WHERE subject = ? ORDER BY path, rowid").all(path) as { path: string; text: string; done: number }[];
    return rows.map((r) => ({ path: r.path, text: r.text, done: r.done === 1 })).filter((r) => opts.done === undefined || r.done === opts.done);
  } finally {
    db.close();
  }
}
