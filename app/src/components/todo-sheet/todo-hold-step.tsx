import { TrayIcon, UserIcon } from "@phosphor-icons/react";
import { MenuGroups } from "@/components/list/menu-groups.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHeader } from "./todo-sheet-header.tsx";
import { copy } from "@/content/index.ts";

export function TodoHoldStep({ todo, now, show }: TodoStepProps) {
  return (
    <>
      <TodoSheetHeader
        todo={todo}
        now={now}
        title={copy.todo.putOnHold}
        onBack={() => show("menu")}
      />
      <MenuGroups
        groups={[
          [
            {
              id: "someone",
              icon: UserIcon,
              title: copy.todo.waitingOnSomeone,
              chevron: true,
              onClick: () => show("someone"),
            },
            {
              id: "something",
              icon: TrayIcon,
              title: copy.todo.waitingOnSomething,
              sub: copy.todo.waitingOnSomethingHint,
              chevron: true,
              onClick: () => show("something"),
            },
          ],
        ]}
      />
    </>
  );
}
