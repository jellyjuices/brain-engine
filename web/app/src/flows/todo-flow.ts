import { applyChange, undoChange } from "@/lib/sync/changes.ts";
import type { Decision, TodoRef } from "@/lib/sync/local-edit.ts";
import { addDays, noteHref, todayIso } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";
import { todoSheet } from "@/components/todo-sheet/todo-sheet.tsx";
import { toast } from "@/components/toast/toast-store.ts";
import { isOffline } from "@/lib/sync/queued-text.ts";
import { copy } from "@/content/index.ts";

export async function commit(
  todo: TodoRef,
  d: Decision,
  collapse?: () => Promise<void>,
): Promise<void> {
  await collapse?.();
  try {
    const change = await applyChange(todo, d, todayIso());
    const offline = isOffline();
    toast(offline ? copy.save.changeOffline(change.label) : change.label, {
      ...(offline && { tone: "offline" as const, ms: 6000 }),
      action: {
        label: copy.common.undo,
        onClick: () =>
          void undoChange(change).then((ok) =>
            ok ? toast(copy.save.undone) : toast(copy.save.undoTooLate, { tone: "error" }),
          ),
      },
    });
  } catch {
    toast(copy.save.failed, { tone: "error" });
  }
}

export async function openTodo(
  todo: TodoRef,
  start: "menu" | "done" = "menu",
  collapse?: () => Promise<void>,
): Promise<void> {
  const r = await todoSheet(todo, start);
  if (!r) return;
  if (r.kind === "open") {
    go(noteHref(todo.path));
    return;
  }
  if (r.kind === "doneThenAdd") {
    await commit(todo, { kind: "done", happened: r.happened }, collapse);
    go(`/add?${new URLSearchParams({ into: todo.path, after: todo.text })}`);
    return;
  }
  await commit(todo, r, collapse);
}

export function tomorrow(todo: TodoRef, collapse?: () => Promise<void>) {
  return commit(todo, { kind: "move", when: addDays(todayIso(), 1) }, collapse);
}
