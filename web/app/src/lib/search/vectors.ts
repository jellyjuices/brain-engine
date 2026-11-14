export const MEANING_TOP = 10;
export const MIN_COSINE = 0.3;

export interface StoredVector {
  hash: string;
  vec: Int8Array;
}

export type VectorMap = ReadonlyMap<string, StoredVector>;

export function decodeVector(base64: string): Int8Array {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Int8Array(bytes.buffer);
}

export function cosine(a: Int8Array, b: Int8Array): number {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    aa += x * x;
    bb += y * y;
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

export function nearList(
  query: Int8Array,
  vectors: VectorMap,
  isKnown: (id: string) => boolean,
): string[] {
  return [...vectors]
    .filter(([id]) => isKnown(id))
    .map(([id, stored]) => ({ id, score: cosine(query, stored.vec) }))
    .filter((row) => row.score >= MIN_COSINE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MEANING_TOP)
    .map((row) => row.id);
}
