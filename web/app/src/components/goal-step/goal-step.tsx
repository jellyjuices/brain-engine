import { TodoRow } from "@/components/todo-row-next/todo-row.tsx";
import { doneStep } from "@/flows/goal-flow.ts";
import type { GoalStep as Step } from "@shared/todos/index.ts";
import { niceDate, noteHref } from "@/lib/notes/model.ts";
import { plainText } from "@/lib/notes/search.ts";
import { go } from "@/lib/platform/router.ts";

export interface GoalStepProps {
  step: Step;
  goal: string;
  subject: string;
  showSubject?: boolean;
}

export function GoalStep({ step, goal, subject, showSubject = false }: GoalStepProps) {
  const date = step.done ? step.doneAt : step.due;
  return (
    <TodoRow
      title={plainText(step.text)}
      tag={showSubject ? subject : undefined}
      when={date ? { label: niceDate(date), status: "due" } : undefined}
      checked={step.done}
      disabled={step.done}
      onCheckedChange={() => void doneStep(step, subject, goal)}
      onOpen={() => go(noteHref(step.path))}
    />
  );
}
