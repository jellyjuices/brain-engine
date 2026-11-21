import { toast } from "@/components/toast/toast-store.ts";
import { copy } from "@/content/index.ts";
import { TARGETS_HEADING } from "@shared/todos/index.ts";
import { appendToSection } from "@shared/line/index.ts";
import { towardIn, type TodoPick } from "@/lib/notes/goal-link.ts";
import { goalHref } from "@/lib/notes/goals.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";
import { getNote, putNotes } from "@/lib/storage/store.ts";
import type { OutboxItem } from "@/lib/sync/outbox.ts";
import { queueEdit } from "@/lib/sync/writes.ts";
import { saveFlow } from "./save-flow.ts";

async function editNote(path: string, change: (body: string) => string): Promise<OutboxItem[]> {
  const note = await getNote(path);
  if (!note) return [];
  const body = change(note.body);
  if (body === note.body) return [];
  await putNotes([{ ...note, body }]);
  return [await queueEdit(path, body, note.hash)];
}

async function queueLinks(
  goal: StoredNote,
  picks: TodoPick[],
): Promise<{ queued: OutboxItem[]; linked: number }> {
  const byPath = new Map<string, string[]>();
  for (const pick of picks) {
    if (pick.path) byPath.set(pick.path, [...(byPath.get(pick.path) ?? []), pick.text]);
  }
  const queued: OutboxItem[] = [];
  let linked = 0;
  for (const [path, texts] of byPath) {
    queued.push(
      ...(await editNote(path, (body) =>
        texts.reduce((next, text) => {
          const changed = towardIn(next, text, path, goal);
          if (changed !== null) linked += 1;
          return changed ?? next;
        }, body),
      )),
    );
  }
  return { queued, linked };
}

async function queueTargets(goal: StoredNote, texts: string[]): Promise<OutboxItem[]> {
  if (texts.length === 0) return [];
  return editNote(goal.path, (body) =>
    texts.reduce((next, text) => appendToSection(next, TARGETS_HEADING, `- [ ] ${text}`), body),
  );
}

export async function linkTodos(goal: StoredNote, picks: TodoPick[]): Promise<void> {
  try {
    const { queued, linked } = await queueLinks(goal, picks);
    const last = queued.at(-1);
    if (last) await saveFlow(() => Promise.resolve(last), copy.goals.linked(linked, goal.title));
  } catch {
    toast(copy.toast.failed, { tone: "error" });
  }
}

export async function addTodosToGoal(goal: StoredNote, items: TodoPick[]): Promise<boolean> {
  const texts = items.filter((item) => !item.path).map((item) => item.text);
  const ok = await saveFlow(async () => {
    const links = (await queueLinks(goal, items)).queued;
    const queued = [...links, ...(await queueTargets(goal, texts))];
    const last = queued.at(-1);
    if (!last) throw new Error("nothing to add");
    return last;
  }, copy.sort.addedTo(goal.title));
  if (ok) go(goalHref(goal.path), true);
  return ok;
}
