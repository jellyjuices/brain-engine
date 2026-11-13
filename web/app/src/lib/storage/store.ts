import { openDb } from "./db.ts";
import { hasKey, LockedError, onLock, open, seal, type Sealed } from "@/lib/lock/vault.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { STORE } from "./keys.ts";

type StoreName = typeof STORE.notes | typeof STORE.meta;

let cache: Map<string, StoredNote> | null = null;
let epoch = 0;

export function forgetCache(): void {
  cache = null;
  epoch += 1;
}
onLock(forgetCache);

interface NoteRow {
  path: string;
  sealed: Sealed;
}
interface MetaRow {
  key: string;
  sealed: Sealed;
}
const listeners = new Set<() => void>();

export function onStoreChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function changed() {
  return listeners.forEach((fn) => fn());
}

async function run<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(name, mode);
      const req = fn(tx.objectStore(name));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function sealNote(n: StoredNote): Promise<NoteRow> {
  return {
    path: n.path,
    sealed: await seal(n, `notes/${n.path}`),
  };
}

async function load(): Promise<Map<string, StoredNote>> {
  if (!hasKey()) throw new LockedError();
  if (!cache) {
    const seen = epoch;
    const rows =
      (await run(STORE.notes, "readonly", (s) => s.getAll() as IDBRequest<NoteRow[]>)) ?? [];
    const notes = await Promise.all(rows.map((r) => open<StoredNote>(r.sealed, `notes/${r.path}`)));
    if (seen !== epoch) throw new LockedError();
    cache = new Map(notes.map((n) => [n.path, n]));
  }
  return cache;
}

export async function allNotes(): Promise<StoredNote[]> {
  return [...(await load()).values()];
}

export async function getNote(path: string): Promise<StoredNote | undefined> {
  return (await load()).get(path);
}

export async function putNotes(
  notes: StoredNote[],
  remove: string[] = [],
  quiet = false,
): Promise<void> {
  if (!notes.length && !remove.length) return;
  const map = await load();
  const rows = await Promise.all(notes.map(sealNote));
  await run(STORE.notes, "readwrite", (s) => {
    for (const p of remove) s.delete(p);
    for (const r of rows) s.put(r);
  });
  for (const p of remove) map.delete(p);
  for (const n of notes) map.set(n.path, n);
  if (!quiet) changed();
}

export async function replaceAll(notes: StoredNote[]): Promise<void> {
  const rows = await Promise.all(notes.map(sealNote));
  await run(STORE.notes, "readwrite", (s) => {
    s.clear();
    for (const r of rows) s.put(r);
  });
  cache = new Map(notes.map((n) => [n.path, n]));
  changed();
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  if (!hasKey()) throw new LockedError();
  const row = await run(
    STORE.meta,
    "readonly",
    (s) => s.get(key) as IDBRequest<MetaRow | undefined>,
  );
  return row ? open<T>(row.sealed, `meta/${key}`) : undefined;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  const row: MetaRow = { key, sealed: await seal(value, `meta/${key}`) };
  await run(STORE.meta, "readwrite", (s) => s.put(row));
}

export async function clearStore(): Promise<void> {
  await run(STORE.notes, "readwrite", (s) => s.clear());
  await run(STORE.meta, "readwrite", (s) => s.clear());
  forgetCache();
}
