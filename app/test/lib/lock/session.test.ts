import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearUnlocked,
  expireSession,
  HIDDEN_GRACE,
  IDLE_LIMIT,
  isSessionLapsed,
  isUnlocked,
  renewSession,
  watchSession,
  writeUnlocked,
} from "@/lib/lock/session.ts";
import { SESSION } from "@/lib/storage/keys.ts";

vi.mock("@/lib/lock/vault.ts", () => ({ hasKey: () => true }));

const NINE_AM = Date.parse("2026-11-05T09:00:00Z");

let stop: () => void;
function setVisibility(v: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", { value: v, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NINE_AM);
  sessionStorage.clear();
  localStorage.clear();
  stop = watchSession();
});
afterEach(() => {
  stop();
  clearUnlocked();
  setVisibility("visible");
  vi.useRealTimers();
});

describe("session stamp", () => {
  it("starts locked and opens on unlock", () => {
    expect(isUnlocked()).toBe(false);
    writeUnlocked();
    expect(isUnlocked()).toBe(true);
  });

  it("locks after 5 idle minutes", () => {
    writeUnlocked();
    vi.advanceTimersByTime(IDLE_LIMIT - 1000);
    expect(isUnlocked()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(isUnlocked()).toBe(false);
  });

  it("activity pushes the deadline out", () => {
    writeUnlocked();
    vi.advanceTimersByTime(IDLE_LIMIT - 20_000);
    window.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(IDLE_LIMIT - 20_000);
    expect(isUnlocked()).toBe(true);
  });

  it("locks after 1 minute hidden", () => {
    writeUnlocked();
    setVisibility("hidden");
    vi.advanceTimersByTime(HIDDEN_GRACE - 1000);
    expect(isUnlocked()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(isUnlocked()).toBe(false);
  });

  it("coming back inside the grace keeps it open", () => {
    writeUnlocked();
    setVisibility("hidden");
    vi.advanceTimersByTime(30_000);
    setVisibility("visible");
    expect(isUnlocked()).toBe(true);
  });

  it("is a timestamp in sessionStorage, not a flag, and never holds a password", () => {
    writeUnlocked();
    expect(Object.entries(sessionStorage)).toEqual([
      [SESSION.unlockedUntil, String(NINE_AM + IDLE_LIMIT)],
    ]);
  });

  it("a lapsed cookie is marked until the password renews it", () => {
    expireSession();
    expect(isSessionLapsed()).toBe(true);
    expect(isUnlocked()).toBe(false);
    renewSession();
    expect(isSessionLapsed()).toBe(false);
  });
});
