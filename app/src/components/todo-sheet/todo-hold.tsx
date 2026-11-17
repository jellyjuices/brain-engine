import { TrayIcon, UserIcon } from "@phosphor-icons/react";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHead } from "./todo-sheet-head.tsx";
import { copy } from "@/content/index.ts";

export function TodoHold({ todo, now, show }: TodoStepProps) {
  return (
    <>
      <TodoSheetHead
        todo={todo}
        now={now}
        title={copy.todo.putOnHold}
        onBack={() => show("menu")}
      />
      <List variant="menu">
        <Row
          icon={UserIcon}
          title={copy.todo.waitingOnSomeone}
          chevron
          autoFocus
          onClick={() => show("someone")}
        />
        <Row
          icon={TrayIcon}
          title={copy.todo.waitingOnSomething}
          sub={copy.todo.waitingOnSomethingHint}
          chevron
          onClick={() => show("something")}
        />
      </List>
    </>
  );
}
