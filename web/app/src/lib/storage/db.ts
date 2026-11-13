import { DB_NAME, LOCAL, STORE } from "./keys.ts";

export const DB_VERSION = 3;

export function openDb(): Promise<IDBDatabase> {
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
