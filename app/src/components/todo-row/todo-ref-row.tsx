import { TodoRow } from "./todo-row.tsx";
import type { WhenChipProps } from "../when-chip/when-chip.tsx";
import { whenStatus } from "@/lib/design/when.ts";
import { openTodo, tickTodo, tomorrow } from "@/flows/todo-flow.ts";
import { niceDate, todayIso } from "@/lib/notes/model.ts";
import { plainText } from "@/lib/notes/search.ts";
import type { TodoRef } from "@/lib/sync/local-edit.ts";
import { copy } from "@/content/index.ts";

export interface TodoRefRowProps {
  todo: TodoRef;
  showSubject?: boolean;
  done?: boolean;
  tickNow?: boolean;
}

function whenOf(due: string | undefined, now: string): WhenChipProps | undefined {
  const someday = due === "someday";
  const status = whenStatus({ due: someday ? undefined : due, someday }, now);
  if (!status) return undefined;
  if (status === "someday") return { label: copy.common.someday, status };
  if (status === "today") return { label: copy.common.today, status };
  return { label: niceDate(due ?? now), status };
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
  return (
    <TodoRow
      title={title}
      tag={tag}
      when={whenOf(todo.due, todayIso())}
      checked={false}
      onCheckedChange={() => void (tickNow ? tickTodo(todo) : openTodo(todo, "done"))}
      onOpen={menu}
      onMenu={menu}
      onLater={() => void tomorrow(todo)}
    />
  );
}
