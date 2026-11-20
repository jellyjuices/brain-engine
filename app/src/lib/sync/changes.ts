import { applyDecision, type Decision, type TodoRef } from "./local-edit.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { flush, has, remove } from "./outbox.ts";
import { getNote, putNotes } from "@/lib/storage/store.ts";
import { syncNow } from "./sync.ts";
import { queueDecision, queueUndo } from "./writes.ts";
import { nextDue } from "@shared/line/index.ts";
import { dayLabel } from "@/lib/notes/when-label.ts";
import { copy } from "@/content/index.ts";

export interface Change {
  id: string;
  label: string;
  before: StoredNote | undefined;
  next?: string;
}

let last: Change | null = null;
export function lastChange() {
  return last;
}

function rolledTo(todo: TodoRef, d: Decision, now: string): string | undefined {
  if (!todo.every || (d.kind !== "done" && d.kind !== "skip")) return undefined;
  const due = todo.due && todo.due !== "someday" ? todo.due : now;
  return nextDue(todo.every, due, now);
}

function labelFor(d: Decision, now: string, next: string | undefined) {
  if (!next) return copy.toast.changeToast[d.kind];
  const day = dayLabel(next, now);
  return d.kind === "skip" ? copy.todos.skippedBack(day) : copy.todos.doneBack(day);
}

export function settle(): void {
  void flush()
    .then(() => syncNow())
    .catch(() => undefined);
}

export async function applyChange(todo: TodoRef, d: Decision, now: string): Promise<Change> {
  const before = await getNote(todo.path);
  const after = before && applyDecision(before, todo, d, now);
  if (after) await putNotes([after]);
  const id = await queueDecision(todo.ref, d);
  const next = rolledTo(todo, d, now);
  last = { id, label: labelFor(d, now, next), before, ...(next && { next }) };
  settle();
  return last;
}

export async function undoChange(c: Change): Promise<boolean> {
  if (last?.id !== c.id) return false;
  last = null;
  if (await has(c.id)) await remove(c.id);
  else await queueUndo();
  if (c.before) await putNotes([c.before]);
  settle();
  return true;
}

export function resetChanges() {
  last = null;
}
