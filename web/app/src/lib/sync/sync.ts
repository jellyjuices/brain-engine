import { api } from "./api.ts";
import { ARCHIVE, slugOf, toStored, type StoredNote } from "@/lib/notes/model.ts";
import { flush } from "./outbox.ts";
import { allNotes, getMeta, putNotes, replaceAll, setMeta } from "@/lib/storage/store.ts";
import { META } from "@/lib/storage/keys.ts";
import { applyVectorFeed, type VectorFeed } from "./vector-feed.ts";

export interface SyncState {
  lastSync?: string;
  offline: boolean;
  syncing: boolean;
}

const DAY = 24 * 60 * 60 * 1000;
const OVERLAP = 5000;
const state: SyncState = { offline: false, syncing: false };
const listeners = new Set<() => void>();
let running: Promise<SyncResult> | null = null;
let loaded = false;

export type SyncResult = "ok" | "offline" | "error";

export function syncState(): Readonly<SyncState> {
  return state;
}
export function onSyncChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function emit() {
  return listeners.forEach((fn) => fn());
}

export async function loadSyncState(): Promise<Readonly<SyncState>> {
  if (!loaded) {
    loaded = true;
    state.lastSync = await getMeta<string>(META.lastSync).catch(() => undefined);
    emit();
  }
  return state;
}

export function archivedAway(incoming: StoredNote[], existing: StoredNote[]): string[] {
  const archived = new Set(
    incoming
      .filter((n) => n.path.startsWith(`${ARCHIVE}/`))
      .map((n) => n.path.slice(ARCHIVE.length + 1)),
  );
  if (!archived.size) return [];
  return existing
    .filter((n) => n.path.startsWith("inbox/") && archived.has(n.path.slice(6)))
    .map((n) => n.path);
}

export function slugsMatch(a: string, b: string) {
  return slugOf(a) === slugOf(b);
}

async function pull(full: boolean): Promise<SyncResult> {
  const last = state.lastSync;
  const useFull = full || !last || Date.now() - Date.parse(last) > DAY;
  const since = useFull
    ? ""
    : `?since=${encodeURIComponent(new Date(Date.parse(last!) - OVERLAP).toISOString())}`;
  const res = await api<{ now: string; notes: Record<string, unknown>[] } & VectorFeed>(
    `/api/notes${since}`,
  );
  if (!res.ok) {
    if (res.offline) state.offline = true;
    return res.offline ? "offline" : "error";
  }
  const notes = res.data.notes.map(toStored);
  if (useFull) await replaceAll(notes);
  else await putNotes(notes, archivedAway(notes, await allNotes()));
  if ((await applyVectorFeed(res.data, useFull)) === "refetch") return pull(true);
  state.offline = false;
  state.lastSync = res.data.now;
  await setMeta(META.lastSync, res.data.now);
  return "ok";
}

export function syncNow(opts: { full?: boolean } = {}): Promise<SyncResult> {
  running ??= (async () => {
    state.syncing = true;
    emit();
    try {
      await loadSyncState();
      await flush().catch(() => undefined);
      return await pull(!!opts.full);
    } catch {
      return "error" as const;
    } finally {
      state.syncing = false;
      running = null;
      emit();
    }
  })();
  return running;
}

export function startSync(): () => void {
  function go() {
    void syncNow();
  }
  function onVisible() {
    return document.visibilityState === "visible" && go();
  }
  function onOffline() {
    state.offline = true;
    emit();
  }
  window.addEventListener("online", go);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisible);
  go();
  return () => {
    window.removeEventListener("online", go);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export function resetSyncState() {
  state.lastSync = undefined;
  state.offline = false;
  state.syncing = false;
  loaded = false;
  running = null;
}
