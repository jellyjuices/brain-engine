import { openDb } from "@/lib/storage/db.ts";
import { bytes, enc, importDk, passwordKek, unwrap, wrap } from "./key-crypto.ts";
import {
  readRecord,
  withKeys,
  writeRecord,
  type FingerprintRecord,
  type MacRecord,
  type PasswordRecord,
} from "./key-records.ts";
import { STORE } from "@/lib/storage/keys.ts";
import { copy } from "@/content/index.ts";

export class LockedError extends Error {
  constructor() {
    super(copy.lock.locked);
    this.name = "LockedError";
  }
}

export interface Sealed {
  iv: Uint8Array<ArrayBuffer>;
  data: Uint8Array<ArrayBuffer>;
}

interface Held {
  dk: CryptoKey;
  kek: CryptoKey;
  iv: Uint8Array<ArrayBuffer>;
  wrapped: Uint8Array<ArrayBuffer>;
  aad: string;
}

const ITERATIONS = 600_000;
const dec = new TextDecoder();

let held: Held | null = null;
const lockListeners = new Set<() => void>();

export function hasKey() {
  return held !== null;
}

export function onLock(fn: () => void) {
  lockListeners.add(fn);
  return () => {
    lockListeners.delete(fn);
  };
}

export function lockVault(): void {
  held = null;
  lockListeners.forEach((fn) => fn());
}

export async function hasVault(): Promise<boolean> {
  return (await readRecord("password")) !== undefined;
}

export async function resetVault(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(Object.values(STORE), "readwrite");
      for (const name of Object.values(STORE)) tx.objectStore(name).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
  lockVault();
}

async function hold(
  raw: Uint8Array<ArrayBuffer>,
  kek: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
  wrapped: Uint8Array<ArrayBuffer>,
  aad: string,
) {
  const dk = await importDk(raw);
  raw.fill(0);
  held = { dk, kek, iv, wrapped, aad };
}

export async function unlockWithPassword(password: string): Promise<"ok" | "wrong" | "new"> {
  const rec = await readRecord<PasswordRecord>("password");
  if (!rec) {
    const raw = bytes(32);
    const salt = bytes(16);
    const kek = await passwordKek(password, salt, ITERATIONS);
    const { iv, wrapped } = await wrap(kek, raw, "keys/password");
    await writeRecord({ id: "password", salt, iterations: ITERATIONS, iv, wrapped });
    await hold(raw, kek, iv, wrapped, "keys/password");
    return "new";
  }
  const kek = await passwordKek(password, rec.salt, rec.iterations);
  const raw = await unwrap(kek, rec.iv, rec.wrapped, "keys/password");
  if (!raw) return "wrong";
  await hold(raw, kek, rec.iv, rec.wrapped, "keys/password");
  return "ok";
}

export async function unlockWithDevice(): Promise<boolean> {
  const rec = await readRecord<FingerprintRecord>("fingerprint");
  if (!rec?.deviceKey) return false;
  const raw = await unwrap(rec.deviceKey, rec.iv, rec.wrapped, "keys/fingerprint");
  if (!raw) return false;
  await hold(raw, rec.deviceKey, rec.iv, rec.wrapped, "keys/fingerprint");
  return true;
}

export async function unlockOnMac(): Promise<void> {
  const rec = await readRecord<MacRecord>("mac");
  const raw = rec?.macKey ? await unwrap(rec.macKey, rec.iv, rec.wrapped, "keys/mac") : null;
  if (rec && raw) return hold(raw, rec.macKey, rec.iv, rec.wrapped, "keys/mac");
  if (rec) await resetVault();
  const fresh = bytes(32);
  const macKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
  const { iv, wrapped } = await wrap(macKey, fresh, "keys/mac");
  await writeRecord({ id: "mac", macKey, iv, wrapped });
  await hold(fresh, macKey, iv, wrapped, "keys/mac");
}

export async function enrollDevice(credentialId: string): Promise<void> {
  const h = held;
  if (!h) throw new LockedError();
  const raw = await unwrap(h.kek, h.iv, h.wrapped, h.aad);
  if (!raw) throw new LockedError();
  try {
    const deviceKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
    const { iv, wrapped } = await wrap(deviceKey, raw, "keys/fingerprint");
    await writeRecord({ id: "fingerprint", credentialId, deviceKey, iv, wrapped });
  } finally {
    raw.fill(0);
  }
}

export async function fingerprintCredential(): Promise<string | null> {
  const rec = await readRecord<FingerprintRecord>("fingerprint");
  return rec?.deviceKey ? rec.credentialId : null;
}

export function forgetFingerprint() {
  return withKeys("readwrite", (s) => s.delete("fingerprint")).then(() => undefined);
}

export async function rewrap(password: string): Promise<void> {
  const h = held;
  if (!h) throw new LockedError();
  const raw = await unwrap(h.kek, h.iv, h.wrapped, h.aad);
  if (!raw) throw new LockedError();
  try {
    const salt = bytes(16);
    const kek = await passwordKek(password, salt, ITERATIONS);
    const { iv, wrapped } = await wrap(kek, raw, "keys/password");
    await writeRecord({ id: "password", salt, iterations: ITERATIONS, iv, wrapped });
    held = { ...h, kek, iv, wrapped, aad: "keys/password" };
  } finally {
    raw.fill(0);
  }
}

export async function seal(value: unknown, aad: string): Promise<Sealed> {
  if (!held) throw new LockedError();
  const iv = bytes(12);
  const data = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: enc.encode(aad) },
      held.dk,
      enc.encode(JSON.stringify(value)),
    ),
  );
  return { iv, data };
}

export async function open<T>(sealed: Sealed, aad: string): Promise<T> {
  if (!held) throw new LockedError();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: sealed.iv, additionalData: enc.encode(aad) },
    held.dk,
    sealed.data,
  );
  return JSON.parse(dec.decode(plain)) as T;
}
