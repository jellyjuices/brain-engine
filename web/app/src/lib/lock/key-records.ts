import { openDb } from "@/lib/storage/db.ts";
import { STORE } from "@/lib/storage/keys.ts";

export interface PasswordRecord {
  id: "password";
  salt: Uint8Array<ArrayBuffer>;
  iterations: number;
  iv: Uint8Array<ArrayBuffer>;
  wrapped: Uint8Array<ArrayBuffer>;
}

export interface FingerprintRecord {
  id: "fingerprint";
  credentialId: string;
  deviceKey: CryptoKey;
  iv: Uint8Array<ArrayBuffer>;
  wrapped: Uint8Array<ArrayBuffer>;
}

export interface MacRecord {
  id: "mac";
  macKey: CryptoKey;
  iv: Uint8Array<ArrayBuffer>;
  wrapped: Uint8Array<ArrayBuffer>;
}

export async function withKeys<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE.keys, mode);
      const req = fn(tx.objectStore(STORE.keys));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function readRecord<T>(id: "password" | "fingerprint" | "mac") {
  return withKeys("readonly", (s) => s.get(id) as IDBRequest<T | undefined>);
}
export function writeRecord(rec: PasswordRecord | FingerprintRecord | MacRecord) {
  return withKeys("readwrite", (s) => s.put(rec)).then(() => undefined);
}
