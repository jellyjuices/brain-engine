import { TodoRow } from "./todo-row.tsx";
import { openTodo, tickTodo, tomorrow } from "@/flows/todo-flow.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { plainText } from "@/lib/notes/search.ts";
import { whenLabel } from "@/lib/notes/when-label.ts";
import type { TodoRef } from "@/lib/sync/local-edit.ts";

export interface TodoRefRowProps {
  todo: TodoRef;
  showSubject?: boolean;
  done?: boolean;
  tickNow?: boolean;
}

export function TodoRefRow({ todo, showSubject = true, done, tickNow }: TodoRefRowProps) {
  const title = plainText(todo.text);
  const tag = showSubject && todo.kind !== "event" ? todo.subject : undefined;
  function doneMenu() {
    void openTodo(todo, "doneMenu");
  }
  function menu() {
    void openTodo(todo, "menu");
  }
  if (done)
    return (
      <TodoRow
        title={title}
        tag={tag}
        checked
        onCheckedChange={doneMenu}
        onOpen={doneMenu}
        onMenu={doneMenu}
      />
    );
  const tickAtOnce = tickNow || todo.every !== undefined;
  return (
    <TodoRow
      title={title}
      tag={tag}
      when={whenLabel(todo, todayIso())}
      checked={false}
      onCheckedChange={() => void (tickAtOnce ? tickTodo(todo) : openTodo(todo, "done"))}
      onOpen={menu}
      onMenu={menu}
      onLater={() => void tomorrow(todo)}
    />
  );
}
