import { runStore } from "./db.ts";
import { STORE, VECTORS } from "./keys.ts";
import { hasKey, LockedError, onLock, open, seal, type Sealed } from "@/lib/lock/vault.ts";
import { decodeVector, type StoredVector, type VectorMap } from "@/lib/search/vectors.ts";

export interface FeedVector {
  id: string;
  hash: string;
  vec: string;
}

interface SealedVector {
  hash: string;
  vec: string;
}

interface VectorRow {
  id: string;
  sealed?: Sealed;
  model?: string;
}

const MODEL_ROW = VECTORS.modelRow;

let cache: Map<string, StoredVector> | null = null;

export function forgetVectors(): void {
  cache = null;
}
onLock(forgetVectors);

function aad(id: string) {
  return `vectors/${id}`;
}

async function rows(): Promise<VectorRow[]> {
  return (
    (await runStore(STORE.vectors, "readonly", (s) => s.getAll() as IDBRequest<VectorRow[]>)) ?? []
  );
}

export async function vectorModel(): Promise<string | undefined> {
  const row = await runStore(
    STORE.vectors,
    "readonly",
    (s) => s.get(MODEL_ROW) as IDBRequest<VectorRow | undefined>,
  );
  return row?.model;
}

export async function loadVectors(): Promise<VectorMap> {
  if (!hasKey()) throw new LockedError();
  if (!cache) {
    const sealed = (await rows()).filter((row) => row.sealed);
    const opened = await Promise.all(
      sealed.map(async (row) => {
        const value = await open<SealedVector>(row.sealed!, aad(row.id));
        return [row.id, { hash: value.hash, vec: decodeVector(value.vec) }] as const;
      }),
    );
    cache = new Map(opened);
  }
  return cache;
}

export async function saveVectors(
  model: string,
  vectors: readonly FeedVector[],
  replace: boolean,
): Promise<void> {
  const sealed = await Promise.all(
    vectors.map(async (item): Promise<VectorRow> => ({
      id: item.id,
      sealed: await seal({ hash: item.hash, vec: item.vec } satisfies SealedVector, aad(item.id)),
    })),
  );
  await runStore(STORE.vectors, "readwrite", (s) => {
    if (replace) s.clear();
    s.put({ id: MODEL_ROW, model } satisfies VectorRow);
    for (const row of sealed) s.put(row);
  });
  if (replace) cache = null;
  for (const item of vectors) cache?.set(item.id, { hash: item.hash, vec: decodeVector(item.vec) });
}

export async function clearVectors(): Promise<void> {
  await runStore(STORE.vectors, "readwrite", (s) => s.clear());
  forgetVectors();
}
