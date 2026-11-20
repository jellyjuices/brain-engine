import { useState } from "react";
import { openSheet, type Finish } from "@/components/sheet/open-sheet.tsx";
import { todayIso } from "@/lib/notes/model.ts";
import type { Decision, TodoRef } from "@/lib/sync/local-edit.ts";
import { TodoResolveStep } from "./todo-resolve-step.tsx";
import { TodoDateStep } from "./todo-date-step.tsx";
import { TodoDoneMenu } from "./todo-done-menu.tsx";
import { TodoEditStep } from "./todo-edit-step.tsx";
import { TodoHoldStep } from "./todo-hold-step.tsx";
import { TodoMenu } from "./todo-menu.tsx";
import { TodoRepeatMenu } from "./todo-repeat-menu.tsx";
import { TodoWaitingStep } from "./todo-waiting-step.tsx";

export type SheetResult = Decision | { kind: "open" } | { kind: "doneThenAdd"; happened?: string };
export type Step =
  "menu" | "doneMenu" | "edit" | "done" | "day" | "drop" | "hold" | "someone" | "something";

export interface TodoSheetProps {
  todo: TodoRef;
  start: Step;
  now: string;
  finish: Finish<SheetResult>;
}

export function TodoSheet({ todo, start, now, finish }: TodoSheetProps) {
  const [step, setStep] = useState<Step>(start);
  const props = { todo, now, finish, show: setStep };

  const repeats = todo.every !== undefined && todo.kind === "todo";
  if (repeats && (step === "menu" || step === "doneMenu" || step === "done"))
    return <TodoRepeatMenu {...props} />;
  if (step === "menu") return <TodoMenu {...props} />;
  if (step === "doneMenu") return <TodoDoneMenu {...props} />;
  if (step === "edit")
    return <TodoEditStep {...props} back={start === "doneMenu" ? "doneMenu" : "menu"} />;
  if (step === "day") return <TodoDateStep {...props} />;
  if (step === "hold") return <TodoHoldStep {...props} />;
  if (step === "someone" || step === "something")
    return <TodoWaitingStep key={step} {...props} kind={step} />;
  return <TodoResolveStep key={step} {...props} step={step} />;
}

export function todoSheet(
  todo: TodoRef,
  start: Step = "menu",
  now = todayIso(),
): Promise<SheetResult | null> {
  return openSheet<SheetResult>(todo.text, (finish) => (
    <TodoSheet todo={todo} start={start} now={now} finish={finish} />
  ));
}
