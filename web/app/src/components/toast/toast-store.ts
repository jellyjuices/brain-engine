export interface ToastAction {
  label: string;
  onClick: () => void;
}

export type ToastTone = "offline" | "error";

export interface ToastItem {
  id: number;
  message: string;
  action?: ToastAction;
  tone?: ToastTone;
  leaving: boolean;
}

export interface ToastOptions {
  ms?: number;
  action?: ToastAction;
  tone?: ToastTone;
}

const LEAVE_MS = 200;
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Set<ReturnType<typeof setTimeout>>();

function publish(next: ToastItem[]) {
  items = next;
  listeners.forEach((fn) => fn());
}

function later(fn: () => void, ms: number) {
  const timer = setTimeout(() => {
    timers.delete(timer);
    fn();
  }, ms);
  timers.add(timer);
}

export function closeToast(id: number) {
  if (!items.some((t) => t.id === id && !t.leaving)) return;
  publish(items.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
  later(() => publish(items.filter((t) => t.id !== id)), LEAVE_MS);
}

export function toast(message: string, opts: number | ToastOptions = {}) {
  const o = typeof opts === "number" ? { ms: opts } : opts;
  const id = nextId++;
  publish([...items, { id, message, action: o.action, tone: o.tone, leaving: false }]);
  later(() => closeToast(id), o.ms ?? (o.action ? 5000 : 3000));
}

export function clearToasts() {
  timers.forEach(clearTimeout);
  timers.clear();
  publish([]);
}

export function subscribeToasts(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toastSnapshot(): ToastItem[] {
  return items;
}
