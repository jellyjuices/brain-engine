import { Checkbox } from "@/components/checkbox/checkbox.tsx";
import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import { laterAction } from "@/components/todo-row/todo-row-actions.tsx";
import { openTodo, tickTodo, tomorrow } from "@/flows/todo-flow.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { makeTodo } from "@/lib/notes/todos.ts";
import { plainText } from "@/lib/notes/search.ts";
import { goalOf, linkLabel, type ViewTodo } from "@/lib/notes/todo-views.ts";
import { whenLabel } from "@/lib/notes/when-label.ts";
import { go } from "@/lib/platform/router.ts";

export interface TodoListRowProps {
  todo: ViewTodo;
  now: string;
  showSubject: boolean;
}

export function TodoListRow({ todo, now, showSubject }: TodoListRowProps) {
  const ref = makeTodo({
    text: todo.text,
    path: todo.path,
    subject: todo.noteTitle,
    ref: todo.ref,
    due: todo.due,
    every: todo.every,
  });
  const goal = goalOf(todo);
  const title = plainText(todo.text);
  return (
    <TodoRow
      title={title}
      surface="primary"
      start={<Checkbox label={title} onCheckedChange={() => void tickTodo(ref, goal)} />}
      tag={showSubject ? todo.noteTitle : undefined}
      when={whenLabel(
        { due: todo.due, every: todo.every, waiting: todo.outcome === "waiting" },
        now,
      )}
      people={todo.with?.map(linkLabel)}
      goal={goal}
      onOpen={() => go(noteHref(todo.path))}
      onMenu={() => void openTodo(ref, "menu")}
      actions={[laterAction(() => void tomorrow(ref))]}
    />
  );
}
