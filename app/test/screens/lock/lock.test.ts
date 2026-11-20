import "fake-indexeddb/auto";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/content/index.ts";
import { fastPasswordKeys } from "../../helpers.ts";

type Vault = typeof import("@/lib/lock/vault.ts");
type Session = typeof import("@/lib/lock/session.ts");
let vault: Vault;
let session: Session;
let notice: typeof import("@/lib/lock/notice.ts");
let outbox: typeof import("@/lib/sync/outbox.ts");

function deleteDb() {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("brain");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function reply(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status });
}
function online(status = 200) {
  return vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => reply(status)),
  );
}
function offline() {
  return vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
}

async function submit(password: string) {
  const user = userEvent.setup();
  const field = screen.getByLabelText("Password");
  await user.clear(field);
  await user.type(field, password);
  await user.click(screen.getByRole("button", { name: "Unlock" }));
  await vi.waitFor(() =>
    expect(screen.queryByRole("button", { name: copy.lock.checking })).toBeNull(),
  );
}
function message() {
  return screen.queryByRole("alert")?.textContent ?? "";
}

beforeAll(async () => {
  await import("@/screens/lock/mount-lock.tsx");
});
beforeEach(async () => {
  fastPasswordKeys();
  await deleteDb();
  sessionStorage.clear();
  localStorage.clear();
  document.body.innerHTML = "";
  vi.resetModules();
  vault = await import("@/lib/lock/vault.ts");
  session = await import("@/lib/lock/session.ts");
  notice = await import("@/lib/lock/notice.ts");
  outbox = await import("@/lib/sync/outbox.ts");
  (await import("@/screens/lock/mount-lock.tsx")).mountLock();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("lock screen and vault", () => {
  it("a first unlock online makes the vault and opens", async () => {
    online();
    await submit("pw one");
    expect(vault.hasKey()).toBe(true);
    expect(session.isUnlocked()).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a stamp with no key still shows the lock (what a reload looks like)", async () => {
    online();
    await submit("pw one");
    vault.lockVault();
    expect(session.isUnlocked()).toBe(false);
  });

  it("offline with no vault yet asks to connect", async () => {
    offline();
    await submit("pw one");
    expect(message()).toBe(copy.lock.offline);
    expect(vault.hasKey()).toBe(false);
    expect(await vault.hasVault()).toBe(false);
  });

  it("offline with a vault opens the copy on the right password only", async () => {
    await vault.unlockWithPassword("pw one");
    vault.lockVault();
    offline();
    await submit("nope");
    expect(message()).toBe(copy.lock.wrong);
    expect(session.isUnlocked()).toBe(false);
    await submit("pw one");
    expect(vault.hasKey()).toBe(true);
    expect(session.isUnlocked()).toBe(true);
  });

  it("a changed server password starts the vault again and says waiting changes were cleared", async () => {
    await vault.unlockWithPassword("old pw");
    await outbox.enqueue("add", { text: "waiting" });
    vault.lockVault();
    online();
    await submit("new pw");
    expect(session.isUnlocked()).toBe(true);
    expect(await outbox.count()).toBe(0);
    expect(notice.takeNotice()).toBe(copy.lock.passwordChanged);
    vault.lockVault();
    expect(await vault.unlockWithPassword("new pw")).toBe("ok");
  });

  it("a changed server password with nothing waiting gives no notice", async () => {
    await vault.unlockWithPassword("old pw");
    vault.lockVault();
    online();
    await submit("new pw");
    expect(session.isUnlocked()).toBe(true);
    expect(notice.takeNotice()).toBeNull();
  });

  it("a wrong password at the server leaves the vault shut", async () => {
    await vault.unlockWithPassword("pw one");
    vault.lockVault();
    online(401);
    await submit("bad");
    expect(message()).toBe(copy.lock.wrong);
    expect(vault.hasKey()).toBe(false);
  });
});
