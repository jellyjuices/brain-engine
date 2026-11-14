import { onLock } from "@/lib/lock/vault.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { loadVectors } from "@/lib/storage/vectors.ts";
import { findIn, type DeviceFind } from "./device-find.ts";
import { embedQuery } from "./embed-query.ts";
import type { VectorMap } from "./vectors.ts";
import { createWordIndex, type WordIndex } from "./word-index.ts";

const NO_VECTORS: VectorMap = new Map();

let index: WordIndex | null = null;

export function forgetDeviceIndex(): void {
  index = null;
}
onLock(forgetDeviceIndex);

export function syncDeviceIndex(notes: readonly StoredNote[]): WordIndex {
  index ??= createWordIndex();
  index.sync(notes);
  return index;
}

export async function findOnDevice(q: string, notes: readonly StoredNote[]): Promise<DeviceFind> {
  const current = syncDeviceIndex(notes);
  const [vectors, queryVector] = await Promise.all([
    loadVectors().catch(() => NO_VECTORS),
    embedQuery(q).catch(() => null),
  ]);
  return findIn(current, q, vectors, queryVector);
}
