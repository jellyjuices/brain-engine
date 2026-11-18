import { toast } from "@/components/toast/toast-store.ts";
import type { GoalStep } from "@shared/todos/index.ts";
import { crossTarget } from "@/lib/notes/goals.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { makeTodo } from "@/lib/notes/todos.ts";
import { getNote, putNotes } from "@/lib/storage/store.ts";
import { queueEdit } from "@/lib/sync/writes.ts";
import { saveFlow } from "./save-flow.ts";
import { tickTodo } from "./todo-flow.ts";
import { copy } from "@/content/index.ts";

async function crossTargetFlow(step: GoalStep): Promise<void> {
  const note = await getNote(step.path);
  const body = note && crossTarget(note.body, step.text, todayIso());
  if (!note || !body) {
    toast(copy.save.failed, { tone: "error" });
    return;
  }
  await putNotes([{ ...note, body }]);
  await saveFlow(() => queueEdit(step.path, body, note.hash), copy.goals.targetDone(step.text));
}

export function doneStep(step: GoalStep, subject: string, goal: string): Promise<void> {
  if (!step.ref) return crossTargetFlow(step);
  return tickTodo(
    makeTodo({
      text: step.text,
      path: step.path,
      subject,
      ref: step.ref,
      due: step.due,
      every: step.every,
    }),
    goal,
  );
}
