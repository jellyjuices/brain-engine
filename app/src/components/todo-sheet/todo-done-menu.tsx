import { ArrowCounterClockwiseIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { MenuGroups } from "@/components/list/menu-groups.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHeader } from "./todo-sheet-header.tsx";
import { copy } from "@/content/index.ts";

export function TodoDoneMenu({ todo, now, finish, show }: TodoStepProps) {
  return (
    <>
      <TodoSheetHeader todo={todo} now={now} />
      <MenuGroups
        groups={[
          [
            {
              id: "reopen",
              icon: ArrowCounterClockwiseIcon,
              title: copy.todo.markNotDone,
              variant: "primary",
              onClick: () => finish({ kind: "reopen" }),
            },
            {
              id: "edit",
              icon: PencilSimpleIcon,
              title: copy.common.edit,
              chevron: true,
              onClick: () => show("edit"),
            },
          ],
          [
            {
              id: "drop",
              icon: TrashIcon,
              title: copy.todo.archive,
              variant: "danger",
              onClick: () => finish({ kind: "drop" }),
            },
          ],
        ]}
      />
    </>
  );
}
