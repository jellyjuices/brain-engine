import { beforeAll, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({ mount: 0, teardown: 0 }));
vi.mock("@/shell/app.tsx", () => ({
  mountApp: (root: HTMLElement) => {
    calls.mount += 1;
    root.append(Object.assign(document.createElement("p"), { textContent: "secret note" }));
    return () => {
      calls.teardown += 1;
    };
  },
}));

const vault = vi.hoisted(() => ({ locked: 0 }));
vi.mock("@/lib/lock/vault.ts", () => ({
  hasKey: () => true,
  lockVault: () => void (vault.locked += 1),
  takeNotice: () => null,
  setNotice: () => {},
  hasVault: async () => true,
  resetVault: async () => {},
  unlockWithPassword: async () => "ok",
  unlockWithDevice: async () => false,
  enrollDevice: async () => {},
  fingerprintCredential: async () => null,
  forgetFingerprint: async () => {},
}));

function appEl() {
  return document.getElementById("app") as HTMLElement;
}
function lockShown() {
  return document.querySelector('[role="dialog"]') !== null;
}

let session: typeof import("@/lib/lock/session.ts");

beforeAll(async () => {
  sessionStorage.clear();
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
  vi.stubEnv("SHOW_LOCK", "true");
  session = await import("@/lib/lock/session.ts");
  await import("@/main.ts");
  await vi.waitFor(() => expect(lockShown()).toBe(true), { timeout: 25_000 });
}, 30_000);

describe("lock gate", () => {
  it("shows only the lock at start, with no app mounted", () => {
    expect(lockShown()).toBe(true);
    expect(calls.mount).toBe(0);
    expect(appEl().childElementCount).toBe(0);
  });

  it("mounts the app only after an unlock, and hides the lock", async () => {
    session.writeUnlocked();
    await vi.waitFor(() => expect(calls.mount).toBe(1));
    expect(appEl().textContent).toContain("secret note");
    expect(lockShown()).toBe(false);
  });

  it("tears the app down and empties #app when the lock returns", () => {
    session.clearUnlocked();
    expect(calls.teardown).toBe(1);
    expect(appEl().childElementCount).toBe(0);
    expect(document.title).toBe("Brain");
    expect(lockShown()).toBe(true);
    expect(vault.locked).toBeGreaterThan(0);
  });

  it("tears down on a 401 from the server", async () => {
    session.writeUnlocked();
    await vi.waitFor(() => expect(calls.mount).toBe(2));
    window.dispatchEvent(new Event("brain:locked"));
    expect(calls.teardown).toBe(2);
    expect(appEl().childElementCount).toBe(0);
    expect(lockShown()).toBe(true);
  });

  it("does not mount if the lock returns while the app module loads", async () => {
    session.renewSession();
    session.writeUnlocked();
    session.clearUnlocked();
    await import("@/shell/app.tsx");
    expect(calls.mount).toBe(2);
    expect(appEl().childElementCount).toBe(0);
  });
});
