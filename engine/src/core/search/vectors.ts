import type { DatabaseSync } from "node:sqlite";

const MEANING_TOP = 10;
const MIN_COSINE = 0.3;

export interface Pending {
  id: string;
  hash: string;
  embed: string;
}

function toInt8(vector: ArrayLike<number>): Int8Array {
  let peak = 0;
  for (let i = 0; i < vector.length; i++) peak = Math.max(peak, Math.abs(vector[i] ?? 0));
  const scale = peak > 0 ? 127 / peak : 0;
  return Int8Array.from({ length: vector.length }, (_, i) => Math.round((vector[i] ?? 0) * scale));
}

function asInt8(blob: Uint8Array): Int8Array {
  return new Int8Array(blob.buffer, blob.byteOffset, blob.byteLength);
}

function cosine(query: ArrayLike<number>, stored: Int8Array): number {
  let dot = 0, qq = 0, ss = 0;
  const n = Math.min(query.length, stored.length);
  for (let i = 0; i < n; i++) {
    const q = query[i] ?? 0;
    const s = stored[i] ?? 0;
    dot += q * s;
    qq += q * q;
    ss += s * s;
  }
  return qq && ss ? dot / Math.sqrt(qq * ss) : 0;
}

export function pendingEntries(db: DatabaseSync, model: string): Pending[] {
  return db
    .prepare("SELECT e.id, e.hash, e.embed FROM entries e LEFT JOIN vectors v ON v.id = e.id AND v.model = ? AND v.hash = e.hash WHERE v.id IS NULL AND e.embed != '' ORDER BY e.path, e.line")
    .all(model) as unknown as Pending[];
}

export function storeVectors(db: DatabaseSync, model: string, items: Pending[], vectors: ArrayLike<number>[]) {
  const put = db.prepare("INSERT OR REPLACE INTO vectors (id, hash, model, vec, at) VALUES (?,?,?,?,?)");
  const at = Date.now();
  items.forEach((item, i) => {
    const vector = vectors[i];
    if (vector) put.run(item.id, item.hash, model, new Uint8Array(toInt8(vector).buffer), at);
  });
}

export function hasVectors(db: DatabaseSync, model: string): boolean {
  return db.prepare("SELECT 1 FROM vectors WHERE model = ? LIMIT 1").get(model) !== undefined;
}

export function storedVector(db: DatabaseSync, model: string, id: string): Int8Array | null {
  const row = db.prepare("SELECT v.vec FROM vectors v JOIN entries e ON e.id = v.id AND e.hash = v.hash WHERE v.model = ? AND v.id = ?").get(model, id) as { vec: Uint8Array } | undefined;
  return row ? asInt8(row.vec) : null;
}

export function meaningList(db: DatabaseSync, model: string, query: ArrayLike<number>, top = MEANING_TOP): string[] {
  const rows = db.prepare("SELECT v.id, v.vec FROM vectors v JOIN entries e ON e.id = v.id AND e.hash = v.hash WHERE v.model = ?").all(model) as { id: string; vec: Uint8Array }[];
  return rows
    .map((row) => ({ id: row.id, score: cosine(query, asInt8(row.vec)) }))
    .filter((row) => row.score >= MIN_COSINE)
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
    .map((row) => row.id);
}
