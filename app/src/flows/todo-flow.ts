import { applyChange, undoChange, type Change } from "@/lib/sync/changes.ts";
import type { Decision, TodoRef } from "@/lib/sync/local-edit.ts";
import { addDays, noteHref, todayIso } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";
import { todoSheet, type Step } from "@/components/todo-sheet/todo-sheet.tsx";
import { requestAdd } from "@/components/add-panel/add-request.ts";
import { toast } from "@/components/toast/toast-store.ts";
import { isOffline } from "@/lib/sync/queued-text.ts";
import { copy } from "@/content/index.ts";

function undoAction(change: Change) {
  return {
    label: copy.common.undo,
    onClick: () =>
      void undoChange(change).then((ok) =>
        ok ? toast(copy.toast.undone) : toast(copy.toast.undoTooLate, { tone: "error" }),
      ),
  };
}

export async function commit(
  todo: TodoRef,
  d: Decision,
  collapse?: () => Promise<void>,
): Promise<void> {
  await collapse?.();
  try {
    const change = await applyChange(todo, d, todayIso());
    const offline = isOffline();
    toast(offline ? copy.toast.changeOffline(change.label) : change.label, {
      ...(d.kind === "drop" && { tone: "deleted" as const }),
      ...(offline && { tone: "offline" as const, ms: 6000 }),
      action: undoAction(change),
    });
  } catch {
    toast(copy.toast.failed, { tone: "error" });
  }
}

export async function tickTodo(todo: TodoRef, goal?: string): Promise<void> {
  try {
    const change = await applyChange(todo, { kind: "done" }, todayIso());
    if (change.next) {
      toast(change.label, {
        ...(isOffline() && { tone: "offline" as const }),
        action: undoAction(change),
      });
      return;
    }
    const message = goal
      ? copy.todos.doneOnGoal(todo.subject, goal)
      : copy.todos.doneOn(todo.subject);
    toast(message, {
      ms: 6000,
      ...(isOffline() && { tone: "offline" as const }),
      actions: [
        { label: copy.todos.followUp, onClick: () => requestAdd({ into: todo.path }) },
        undoAction(change),
      ],
    });
  } catch {
    toast(copy.toast.failed, { tone: "error" });
  }
}

export async function openTodo(
  todo: TodoRef,
  start: Step = "menu",
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
    requestAdd({ into: todo.path });
    return;
  }
  await commit(todo, r, collapse);
}

export function tomorrow(todo: TodoRef, collapse?: () => Promise<void>) {
  return commit(todo, { kind: "move", when: addDays(todayIso(), 1) }, collapse);
}
