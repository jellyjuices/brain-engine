import { Checkbox } from "@/components/checkbox/checkbox.tsx";
import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import { doneStep } from "@/flows/goal-flow.ts";
import type { GoalStep as Step } from "@shared/todos/index.ts";
import { niceDate, noteHref, todayIso } from "@/lib/notes/model.ts";
import { whenLabel } from "@/lib/notes/when-label.ts";
import { plainText } from "@/lib/notes/search.ts";
import { go } from "@/lib/platform/router.ts";

export interface GoalStepRowProps {
  step: Step;
  goal: string;
  subject: string;
  showSubject?: boolean;
}

export function GoalStepRow({ step, goal, subject, showSubject = false }: GoalStepRowProps) {
  const date = step.done ? step.doneAt : step.due;
  const title = plainText(step.text);
  return (
    <TodoRow
      title={title}
      start={
        <Checkbox
          checked={step.done}
          disabled={step.done}
          label={title}
          onCheckedChange={() => void doneStep(step, subject, goal)}
        />
      }
      tag={showSubject ? subject : undefined}
      when={
        step.every && !step.done
          ? whenLabel(step, todayIso())
          : date
            ? { label: niceDate(date), status: "due" }
            : undefined
      }
      checked={step.done}
      disabled={step.done}
      onOpen={() => go(noteHref(step.path))}
    />
  );
}
