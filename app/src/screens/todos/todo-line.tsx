import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import type { WhenChipProps } from "@/components/when-chip/when-chip.tsx";
import { whenStatus } from "@/lib/design/when.ts";
import { openTodo, tickTodo, tomorrow } from "@/flows/todo-flow.ts";
import { niceDate, noteHref } from "@/lib/notes/model.ts";
import { makeTodo } from "@/lib/notes/todos.ts";
import { plainText } from "@/lib/notes/search.ts";
import { goalOf, linkLabel, type ViewTodo } from "@/lib/notes/todo-views.ts";
import { go } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

export interface TodoLineProps {
  todo: ViewTodo;
  now: string;
  showSubject: boolean;
}

function whenOf(todo: ViewTodo, now: string): WhenChipProps | undefined {
  const waiting = todo.outcome === "waiting";
  const status = whenStatus({ due: todo.due, waiting }, now);
  if (!status) return undefined;
  if (status === "waiting") return { label: copy.todos.waiting, status };
  if (status === "today") return { label: copy.common.today, status };
  return { label: niceDate(todo.due ?? now), status };
}

export function TodoLine({ todo, now, showSubject }: TodoLineProps) {
  const ref = makeTodo({
    text: todo.text,
    path: todo.path,
    subject: todo.noteTitle,
    ref: todo.ref,
    due: todo.due,
  });
  const goal = goalOf(todo);
  return (
    <TodoRow
      title={plainText(todo.text)}
      tag={showSubject ? todo.noteTitle : undefined}
      when={whenOf(todo, now)}
      people={todo.with?.map(linkLabel)}
      goal={goal}
      checked={false}
      onCheckedChange={() => void tickTodo(ref, goal)}
      onOpen={() => go(noteHref(todo.path))}
      onMenu={() => void openTodo(ref, "menu")}
      onLater={() => void tomorrow(ref)}
    />
  );
}
