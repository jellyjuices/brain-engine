import type { StoredNote } from "@/lib/notes/model.ts";
import { getMeta, putNotes, setMeta } from "@/lib/storage/store.ts";
import { META } from "@/lib/storage/keys.ts";

export interface Conflict {
  path: string;
  mine: string;
  current: StoredNote;
  at: string;
}

const listeners = new Set<() => void>();
export function onConflictChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

async function all(): Promise<Record<string, Conflict>> {
  return (await getMeta<Record<string, Conflict>>(META.conflicts)) ?? {};
}

async function save(map: Record<string, Conflict>) {
  await setMeta(META.conflicts, map);
  listeners.forEach((fn) => fn());
}

export async function recordConflict(c: Omit<Conflict, "at">): Promise<void> {
  const map = await all();
  map[c.path] = { ...c, at: new Date().toISOString() };
  await save(map);
}

export async function getConflict(path: string): Promise<Conflict | undefined> {
  return (await all())[path];
}

export async function listConflicts(): Promise<Conflict[]> {
  return Object.values(await all());
}

export async function keepMacCopy(path: string): Promise<void> {
  const map = await all();
  const c = map[path];
  if (!c) return;
  delete map[path];
  await putNotes([c.current]);
  await save(map);
}

export async function keepMine(path: string): Promise<{ body: string; base: string } | undefined> {
  const map = await all();
  const c = map[path];
  if (!c) return undefined;
  delete map[path];
  await putNotes([{ ...c.current, body: c.mine }]);
  await save(map);
  return { body: c.mine, base: c.current.hash };
}
