import { hasKey } from "./vault.ts";
import { SESSION } from "@/lib/storage/keys.ts";

export const IDLE_LIMIT = 5 * 60 * 1000;
export const HIDDEN_GRACE = 60 * 1000;
const REFRESH_STEP = 10 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel"] as const;

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let watching = false;

function publish() {
  return listeners.forEach((fn) => fn());
}

function readExpiry(): number {
  const n = Number(sessionStorage.getItem(SESSION.unlockedUntil));
  return Number.isFinite(n) ? n : 0;
}

function stopTimer() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
}

function moveExpiry(expiry: number) {
  sessionStorage.setItem(SESSION.unlockedUntil, String(expiry));
  stopTimer();
  const remaining = expiry - Date.now();
  if (remaining > 0) timer = setTimeout(clearUnlocked, remaining);
}

function onActivity() {
  const expiry = readExpiry();
  if (expiry <= Date.now()) return;
  const next = Date.now() + IDLE_LIMIT;
  if (next - expiry >= REFRESH_STEP) moveExpiry(next);
}

function onVisibility() {
  const expiry = readExpiry();
  const hidden = document.visibilityState === "hidden";
  if (expiry <= Date.now()) {
    if (!hidden) clearUnlocked();
    return;
  }
  moveExpiry(hidden ? Math.min(expiry, Date.now() + HIDDEN_GRACE) : Date.now() + IDLE_LIMIT);
}

export function watchSession(): () => void {
  if (watching) return () => {};
  watching = true;
  for (const e of ACTIVITY_EVENTS) window.addEventListener(e, onActivity, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  const expiry = readExpiry();
  if (expiry > Date.now()) moveExpiry(expiry);
  return () => {
    watching = false;
    for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity);
    document.removeEventListener("visibilitychange", onVisibility);
    stopTimer();
  };
}

export function subscribeSession(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let onMac = false;

export function setOnMac() {
  onMac = true;
  publish();
}

export function isUnlocked() {
  return (onMac || readExpiry() > Date.now()) && hasKey();
}

export function writeUnlocked() {
  moveExpiry(Date.now() + IDLE_LIMIT);
  publish();
}

export function clearUnlocked() {
  sessionStorage.removeItem(SESSION.unlockedUntil);
  stopTimer();
  publish();
}

export function isSessionLapsed() {
  return localStorage.getItem(SESSION.lapsed) !== null;
}

export function expireSession() {
  localStorage.setItem(SESSION.lapsed, "true");
  clearUnlocked();
}

export function renewSession() {
  localStorage.removeItem(SESSION.lapsed);
  publish();
}
