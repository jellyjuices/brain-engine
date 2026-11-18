import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import { openTodo, tickTodo, tomorrow } from "@/flows/todo-flow.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { makeTodo } from "@/lib/notes/todos.ts";
import { plainText } from "@/lib/notes/search.ts";
import { goalOf, linkLabel, type ViewTodo } from "@/lib/notes/todo-views.ts";
import { whenLabel } from "@/lib/notes/when-label.ts";
import { go } from "@/lib/platform/router.ts";

export interface TodoLineProps {
  todo: ViewTodo;
  now: string;
  showSubject: boolean;
}

export function TodoLine({ todo, now, showSubject }: TodoLineProps) {
  const ref = makeTodo({
    text: todo.text,
    path: todo.path,
    subject: todo.noteTitle,
    ref: todo.ref,
    due: todo.due,
    every: todo.every,
  });
  const goal = goalOf(todo);
  return (
    <TodoRow
      title={plainText(todo.text)}
      tag={showSubject ? todo.noteTitle : undefined}
      when={whenLabel(
        { due: todo.due, every: todo.every, waiting: todo.outcome === "waiting" },
        now,
      )}
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
