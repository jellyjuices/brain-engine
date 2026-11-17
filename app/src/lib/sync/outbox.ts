import type { ApiResult } from "./api.ts";
import { openDb } from "@/lib/storage/db.ts";
import { hasKey, LockedError, open, seal, type Sealed } from "@/lib/lock/vault.ts";
import { STORE } from "@/lib/storage/keys.ts";

export interface OutboxItem<P = unknown> {
  id: string;
  kind: string;
  payload: P;
  created_at: string;
}

export type Handler = (item: OutboxItem) => Promise<ApiResult>;

interface Row {
  id: string;
  created_at: string;
  sealed: Sealed;
}

const SYNC_TAG = "outbox";

const handlers = new Map<string, Handler>();
const listeners = new Set<() => void>();
let flushing: Promise<FlushResult> | null = null;

export interface FlushResult {
  sent: string[];
  dropped: string[];
  left: number;
}

export function registerHandler(kind: string, handler: Handler) {
  handlers.set(kind, handler);
}
export function onOutboxChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function changed() {
  return listeners.forEach((fn) => fn());
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE.outbox, mode);
      const req = fn(tx.objectStore(STORE.outbox));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

let lastStamp = 0;
function stamp() {
  return new Date((lastStamp = Math.max(Date.now(), lastStamp + 1))).toISOString();
}

export async function enqueue<P>(
  kind: string,
  payload: P,
  id: string = crypto.randomUUID(),
): Promise<OutboxItem<P>> {
  const item: OutboxItem<P> = { id, kind, payload, created_at: stamp() };
  const row: Row = {
    id,
    created_at: item.created_at,
    sealed: await seal({ kind, payload }, `${STORE.outbox}/${id}`),
  };
  await run("readwrite", (s) => s.put(row));
  changed();
  void requestBackgroundSync();
  return item;
}

export async function list(): Promise<OutboxItem[]> {
  if (!hasKey()) throw new LockedError();
  const rows = await run("readonly", (s) => s.getAll() as IDBRequest<Row[]>);
  rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return Promise.all(
    rows.map(async (r): Promise<OutboxItem> => {
      const { kind, payload } = await open<{ kind: string; payload: unknown }>(
        r.sealed,
        `${STORE.outbox}/${r.id}`,
      );
      return { id: r.id, kind, payload, created_at: r.created_at };
    }),
  );
}

export function count() {
  return run("readonly", (s) => s.count());
}

export async function has(id: string): Promise<boolean> {
  return (await run("readonly", (s) => s.getKey(id))) !== undefined;
}

export async function remove(id: string) {
  await run("readwrite", (s) => s.delete(id));
  changed();
}

function isPermanent(status: number) {
  return status >= 400 && status < 500 && ![401, 408, 429].includes(status);
}

export function flush(): Promise<FlushResult> {
  flushing ??= doFlush().finally(() => (flushing = null));
  return flushing;
}

async function doFlush(): Promise<FlushResult> {
  const result: FlushResult = { sent: [], dropped: [], left: 0 };
  const items = await list();
  for (const item of items) {
    const handler = handlers.get(item.kind);
    if (!handler) break;
    const res = await handler(item);
    if (res.ok) {
      await remove(item.id);
      result.sent.push(item.id);
    } else if (!res.offline && isPermanent(res.status)) {
      await remove(item.id);
      result.dropped.push(item.id);
    } else break;
  }
  result.left = await count();
  return result;
}

async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    await (
      reg as
        | (ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } })
        | undefined
    )?.sync?.register(SYNC_TAG);
  } catch {}
}

export function autoFlush(onResult?: (r: FlushResult) => void): () => void {
  function go() {
    void flush()
      .then((r) => (r.sent.length || r.dropped.length) && onResult?.(r))
      .catch(() => {});
  }
  function onVisible() {
    return document.visibilityState === "visible" && go();
  }
  function onMessage(e: MessageEvent) {
    return (e.data as { type?: string } | null)?.type === "flush-outbox" && go();
  }
  window.addEventListener("online", go);
  document.addEventListener("visibilitychange", onVisible);
  navigator.serviceWorker?.addEventListener("message", onMessage);
  go();
  return () => {
    window.removeEventListener("online", go);
    document.removeEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.removeEventListener("message", onMessage);
  };
}
