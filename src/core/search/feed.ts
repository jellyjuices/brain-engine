import type { DatabaseSync } from "node:sqlite";

export interface FeedVector {
  id: string;
  hash: string;
  vec: string;
}

export function feedVectors(db: DatabaseSync, model: string, since: number): FeedVector[] {
  const rows = db
    .prepare("SELECT e.id, e.hash, v.vec FROM vectors v JOIN entries e ON e.id = v.id AND e.hash = v.hash WHERE v.model = ? AND COALESCE(v.at, 0) >= ? ORDER BY e.path, e.line")
    .all(model, since) as { id: string; hash: string; vec: Uint8Array }[];
  return rows.map((row) => ({ id: row.id, hash: row.hash, vec: Buffer.from(row.vec).toString("base64") }));
}
