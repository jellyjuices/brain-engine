import { DB_NAME, LOCAL, STORE } from "./keys.ts";
import { askPersist } from "./persist.ts";

export const DB_VERSION = 4;

export type StoreName = (typeof STORE)[keyof typeof STORE];

export function openDb(): Promise<IDBDatabase> {
  askPersist();
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction!;
      if (!db.objectStoreNames.contains(STORE.outbox))
        db.createObjectStore(STORE.outbox, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE.notes))
        db.createObjectStore(STORE.notes, { keyPath: "path" });
      if (!db.objectStoreNames.contains(STORE.meta))
        db.createObjectStore(STORE.meta, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORE.keys))
        db.createObjectStore(STORE.keys, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE.vectors))
        db.createObjectStore(STORE.vectors, { keyPath: "id" });
      if (event.oldVersion > 0 && event.oldVersion < 3) {
        for (const name of [STORE.outbox, STORE.notes, STORE.meta]) tx.objectStore(name).clear();
        try {
          localStorage.removeItem(LOCAL.legacyRecent);
        } catch {}
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function runStore<T>(
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
