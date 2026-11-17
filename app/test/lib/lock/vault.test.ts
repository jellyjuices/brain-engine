import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fastPasswordKeys, fixture } from "../../helpers.ts";

type Vault = typeof import("@/lib/lock/vault.ts");
type Store = typeof import("@/lib/storage/store.ts");
type Outbox = typeof import("@/lib/sync/outbox.ts");
let vault: Vault;
let store: Store;
let outbox: Outbox;

const PW = "correct horse";
const SECRET = "Secret dentist appointment with Dr Zebediah";

function deleteDb() {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("brain");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function load() {
  vi.resetModules();
  vault = await import("@/lib/lock/vault.ts");
  store = await import("@/lib/storage/store.ts");
  outbox = await import("@/lib/sync/outbox.ts");
}

function rawDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("brain");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function rawRows(name: string): Promise<Record<string, unknown>[]> {
  const db = await rawDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction(name).objectStore(name).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function rawPut(name: string, row: unknown) {
  const db = await rawDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(name, "readwrite");
      tx.objectStore(name).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function diskDump(): Promise<string> {
  const parts: string[] = [];
  function walk(v: unknown) {
    if (v instanceof Uint8Array) {
      parts.push(
        new TextDecoder().decode(v),
        String.fromCharCode(...v),
        Buffer.from(v).toString("hex"),
      );
    } else if (v && typeof v === "object") Object.values(v).forEach(walk);
    else if (typeof v === "string") parts.push(v);
  }
  for (const name of ["notes", "meta", "outbox", "keys"]) {
    for (const row of await rawRows(name)) {
      parts.push(JSON.stringify(row));
      walk(row);
    }
  }
  return parts.join("\n");
}

let derive: ReturnType<typeof fastPasswordKeys>;

beforeEach(async () => {
  derive = fastPasswordKeys();
  await deleteDb();
  await load();
});
afterEach(() => derive.mockRestore());

describe("vault keys", () => {
  it("seals and opens a value, with a fresh iv each time", async () => {
    expect(await vault.unlockWithPassword(PW)).toBe("new");
    const a = await vault.seal({ n: 1, s: SECRET }, "notes/a.md");
    const b = await vault.seal({ n: 1, s: SECRET }, "notes/a.md");
    expect(a.iv).toHaveLength(12);
    expect(a.iv).not.toEqual(b.iv);
    expect(a.data).not.toEqual(b.data);
    expect(await vault.open<{ n: number; s: string }>(a, "notes/a.md")).toEqual({
      n: 1,
      s: SECRET,
    });
  });

  it("opens again with the same password, and says wrong for another", async () => {
    expect(await vault.unlockWithPassword(PW)).toBe("new");
    vault.lockVault();
    expect(await vault.unlockWithPassword("not it")).toBe("wrong");
    expect(vault.hasKey()).toBe(false);
    expect(await vault.unlockWithPassword(PW)).toBe("ok");
    expect(vault.hasKey()).toBe(true);
  });

  it("stores the password record with 600000 iterations and a wrapped key, never the key itself", async () => {
    await vault.unlockWithPassword(PW);
    const [rec] = (await rawRows("keys")) as {
      id: string;
      iterations: number;
      salt: Uint8Array;
      iv: Uint8Array;
      wrapped: Uint8Array;
    }[];
    expect(rec).toMatchObject({ id: "password", iterations: 600_000 });
    expect(derive.mock.calls[0]![0]).toMatchObject({ name: "PBKDF2", iterations: 600_000 });
    expect(rec!.salt).toHaveLength(16);
    expect(rec!.iv).toHaveLength(12);
    expect(rec!.wrapped).toHaveLength(32 + 16);
  });

  it("fails on a tampered ciphertext", async () => {
    await vault.unlockWithPassword(PW);
    const sealed = await vault.seal("hello", "meta/x");
    sealed.data[0]! ^= 1;
    await expect(vault.open(sealed, "meta/x")).rejects.toThrow();
  });

  it("fails when a sealed value is moved to another record key or store", async () => {
    await vault.unlockWithPassword(PW);
    const sealed = await vault.seal("hello", "meta/x");
    await expect(vault.open(sealed, "meta/y")).rejects.toThrow();
    await expect(vault.open(sealed, "notes/x")).rejects.toThrow();
  });

  it("throws LockedError for seal and open with no key", async () => {
    await expect(vault.seal("x", "meta/x")).rejects.toBeInstanceOf(vault.LockedError);
    await vault.unlockWithPassword(PW);
    const sealed = await vault.seal("x", "meta/x");
    vault.lockVault();
    await expect(vault.open(sealed, "meta/x")).rejects.toBeInstanceOf(vault.LockedError);
  });

  it("a reload (new module state) has no key until the password is given again", async () => {
    await vault.unlockWithPassword(PW);
    await store.putNotes(fixture());
    await load();
    expect(vault.hasKey()).toBe(false);
    await expect(store.allNotes()).rejects.toBeInstanceOf(vault.LockedError);
    expect(await vault.unlockWithPassword(PW)).toBe("ok");
    expect((await store.allNotes()).map((n) => n.path).sort()).toEqual(
      fixture()
        .map((n) => n.path)
        .sort(),
    );
  });

  it("rewrap moves the key to a new password without touching the data", async () => {
    await vault.unlockWithPassword(PW);
    await store.setMeta("k", { v: 1 });
    await vault.rewrap("brand new");
    vault.lockVault();
    expect(await vault.unlockWithPassword(PW)).toBe("wrong");
    expect(await vault.unlockWithPassword("brand new")).toBe("ok");
    expect(await store.getMeta("k")).toEqual({ v: 1 });
  });

  it("resetVault wipes keys, notes, meta and outbox, and locks", async () => {
    await vault.unlockWithPassword(PW);
    await store.putNotes(fixture());
    await store.setMeta("k", 1);
    await outbox.enqueue("t", { a: 1 });
    await vault.resetVault();
    expect(vault.hasKey()).toBe(false);
    for (const name of ["keys", "notes", "meta", "outbox"])
      expect(await rawRows(name)).toHaveLength(0);
    expect(await vault.hasVault()).toBe(false);
    expect(await vault.unlockWithPassword("another")).toBe("new");
  });
});

describe("Mac key (served by brain serve, no password)", () => {
  it("makes a key the first time and opens the same data after a reload", async () => {
    await vault.unlockOnMac();
    expect(vault.hasKey()).toBe(true);
    const sealed = await vault.seal({ s: SECRET }, "notes/a.md");
    await load();
    expect(vault.hasKey()).toBe(false);
    await vault.unlockOnMac();
    expect(await vault.open<{ s: string }>(sealed, "notes/a.md")).toEqual({ s: SECRET });
    const keys = (await rawRows("keys")) as { id: string }[];
    expect(keys.map((k) => k.id)).toEqual(["mac"]);
  });

  it("keeps the key non-extractable and never writes DK in the clear", async () => {
    await vault.unlockOnMac();
    const [rec] = (await rawRows("keys")) as { macKey: CryptoKey }[];
    expect(rec!.macKey.extractable).toBe(false);
    await store.putNotes([{ ...fixture()[0]!, body: SECRET }]);
    expect(await diskDump()).not.toContain("Zebediah");
  });
});

describe("fingerprint key (device key)", () => {
  it("wraps the key under a device key and opens with it after a lock", async () => {
    await vault.unlockWithPassword(PW);
    await store.setMeta("k", "kept");
    await vault.enrollDevice("cred-1");
    expect(await vault.fingerprintCredential()).toBe("cred-1");
    vault.lockVault();
    expect(await vault.unlockWithDevice()).toBe(true);
    expect(await store.getMeta("k")).toBe("kept");
  });

  it("needs the key in memory to enrol, and is false with no fingerprint record", async () => {
    await expect(vault.enrollDevice("c")).rejects.toBeInstanceOf(vault.LockedError);
    expect(await vault.unlockWithDevice()).toBe(false);
  });

  it("forgetting the fingerprint removes its record and leaves the password working", async () => {
    await vault.unlockWithPassword(PW);
    await vault.enrollDevice("cred-1");
    await vault.forgetFingerprint();
    vault.lockVault();
    expect(await vault.fingerprintCredential()).toBeNull();
    expect(await vault.unlockWithDevice()).toBe(false);
    expect(await vault.unlockWithPassword(PW)).toBe("ok");
  });

  it("can enrol again after unlocking with the fingerprint", async () => {
    await vault.unlockWithPassword(PW);
    await vault.enrollDevice("cred-1");
    vault.lockVault();
    await vault.unlockWithDevice();
    await vault.forgetFingerprint();
    await vault.enrollDevice("cred-2");
    expect(await vault.fingerprintCredential()).toBe("cred-2");
  });

  it("stores a device key that cannot be exported", async () => {
    await vault.unlockWithPassword(PW);
    await vault.enrollDevice("cred-1");
    const rec = (await rawRows("keys")).find((r) => r.id === "fingerprint") as {
      deviceKey: CryptoKey;
    };
    expect(rec.deviceKey.extractable).toBe(false);
    await expect(crypto.subtle.exportKey("raw", rec.deviceKey)).rejects.toThrow();
  });

  it("treats an old PRF fingerprint record as no fingerprint", async () => {
    await vault.unlockWithPassword(PW);
    function bytes(n: number) {
      return new Uint8Array(n).fill(7);
    }
    await rawPut("keys", {
      id: "fingerprint",
      credentialId: "old-cred",
      prfSalt: bytes(32),
      iv: bytes(12),
      wrapped: bytes(48),
    });
    vault.lockVault();
    expect(await vault.fingerprintCredential()).toBeNull();
    expect(await vault.unlockWithDevice()).toBe(false);
    expect(vault.hasKey()).toBe(false);
  });
});

describe("sealed storage", () => {
  it("round trips notes, meta and outbox items through the same public API", async () => {
    await vault.unlockWithPassword(PW);
    await store.putNotes(fixture());
    expect((await store.getNote("people/aisha.md"))?.title).toBe("Aisha");
    await store.setMeta("lastSync", "2026-11-05T00:00:00Z");
    expect(await store.getMeta("lastSync")).toBe("2026-11-05T00:00:00Z");
    const item = await outbox.enqueue("add", { text: SECRET });
    expect(await outbox.list()).toEqual([item]);
  });

  it("reads and writes throw LockedError with no key", async () => {
    await expect(store.allNotes()).rejects.toBeInstanceOf(vault.LockedError);
    await expect(store.putNotes(fixture())).rejects.toBeInstanceOf(vault.LockedError);
    await expect(store.getMeta("x")).rejects.toBeInstanceOf(vault.LockedError);
    await expect(store.setMeta("x", 1)).rejects.toBeInstanceOf(vault.LockedError);
    await expect(outbox.enqueue("t", 1)).rejects.toBeInstanceOf(vault.LockedError);
    await expect(outbox.list()).rejects.toBeInstanceOf(vault.LockedError);
  });

  it("leaves nothing readable on disk: no plaintext from notes, meta, outbox or recent searches", async () => {
    await vault.unlockWithPassword(PW);
    await store.putNotes([
      {
        ...fixture()[0]!,
        title: "Dr Zebediah title",
        description: "Zebediah description",
        body: SECRET,
      },
    ]);
    await store.setMeta("recent", ["zebediah search"]);
    await store.setMeta("lastSync", "plain-sync-marker");
    await outbox.enqueue("add", { text: SECRET });
    const dump = await diskDump();
    for (const needle of [SECRET, "Zebediah", "zebediah search", "plain-sync-marker", PW])
      expect(dump).not.toContain(needle);
    const [row] = (await rawRows("outbox")) as Record<string, unknown>[];
    expect(Object.keys(row!).sort()).toEqual(["created_at", "id", "sealed"]);
    const [noteRow] = (await rawRows("notes")) as Record<string, unknown>[];
    expect(Object.keys(noteRow!).sort()).toEqual(["path", "sealed"]);
  });

  it("rejects a row whose ciphertext was changed", async () => {
    await vault.unlockWithPassword(PW);
    await store.putNotes(fixture());
    const [row] = (await rawRows("notes")) as {
      path: string;
      sealed: { iv: Uint8Array; data: Uint8Array };
    }[];
    row!.sealed.data[3]! ^= 255;
    await rawPut("notes", row);
    store.forgetCache();
    await expect(store.allNotes()).rejects.toThrow();
  });

  it("rejects a row swapped under another path", async () => {
    await vault.unlockWithPassword(PW);
    await store.putNotes(fixture());
    const rows = (await rawRows("notes")) as { path: string; sealed: unknown }[];
    const [a, b] = rows;
    await rawPut("notes", { path: b!.path, sealed: a!.sealed });
    store.forgetCache();
    await expect(store.allNotes()).rejects.toThrow();
  });

  it("rejects an outbox item swapped under another id", async () => {
    await vault.unlockWithPassword(PW);
    const a = await outbox.enqueue("t", { n: 1 });
    const b = await outbox.enqueue("t", { n: 2 });
    const rows = (await rawRows("outbox")) as { id: string; created_at: string; sealed: unknown }[];
    const rowA = rows.find((r) => r.id === a.id)!;
    const rowB = rows.find((r) => r.id === b.id)!;
    await rawPut("outbox", { ...rowB, sealed: rowA.sealed });
    await expect(outbox.list()).rejects.toThrow();
  });

  it("lockVault clears the in-memory note cache", async () => {
    await vault.unlockWithPassword(PW);
    await store.putNotes(fixture());
    expect(await store.allNotes()).toHaveLength(fixture().length);
    vault.lockVault();
    await expect(store.getNote("people/aisha.md")).rejects.toBeInstanceOf(vault.LockedError);
    await vault.unlockWithPassword(PW);
    await store.putNotes([], ["people/aisha.md"]);
    expect(await store.getNote("people/aisha.md")).toBeUndefined();
  });

  it("an outbox count and remove work without the key (the password-changed path needs the count)", async () => {
    await vault.unlockWithPassword(PW);
    const item = await outbox.enqueue("t", 1);
    vault.lockVault();
    expect(await outbox.count()).toBe(1);
    expect(await outbox.has(item.id)).toBe(true);
  });
});

describe("upgrade from version 2", () => {
  it("discards plain rows and the old plain recent searches", async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("brain", 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore("outbox", { keyPath: "id" }).put({
          id: "x",
          kind: "add",
          payload: { text: SECRET },
          created_at: "2026-11-05T00:00:00Z",
        });
        db.createObjectStore("notes", { keyPath: "path" }).put({ path: "a.md", body: SECRET });
        db.createObjectStore("meta", { keyPath: "key" }).put({ key: "lastSync", value: SECRET });
      };
      req.onsuccess = () => (req.result.close(), resolve());
      req.onerror = () => reject(req.error);
    });
    localStorage.setItem("brain.recent", JSON.stringify([SECRET]));
    await vault.unlockWithPassword(PW);
    for (const name of ["outbox", "notes", "meta"]) expect(await rawRows(name)).toHaveLength(0);
    expect(await diskDump()).not.toContain(SECRET);
    expect(localStorage.getItem("brain.recent")).toBeNull();
  });
});
