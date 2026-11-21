import { TodoRow, type TodoRowSurface } from "./todo-row.tsx";
import { laterAction } from "./todo-row-actions.tsx";
import { Checkbox } from "@/components/checkbox/checkbox.tsx";
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
  surface?: TodoRowSurface;
}

export function TodoRefRow({ todo, showSubject = true, done, tickNow, surface }: TodoRefRowProps) {
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
        surface={surface}
        start={<Checkbox checked label={title} onCheckedChange={doneMenu} />}
        onOpen={doneMenu}
        onMenu={doneMenu}
      />
    );
  const tickAtOnce = tickNow || todo.every !== undefined;
  return (
    <TodoRow
      title={title}
      tag={tag}
      surface={surface}
      when={whenLabel(todo, todayIso())}
      start={
        <Checkbox
          label={title}
          onCheckedChange={() => void (tickAtOnce ? tickTodo(todo) : openTodo(todo, "done"))}
        />
      }
      onOpen={menu}
      onMenu={menu}
      actions={[laterAction(() => void tomorrow(todo))]}
    />
  );
}
