import {
  ArchiveIcon,
  CheckIcon,
  PencilSimpleIcon,
  RepeatOnceIcon,
  SkipForwardIcon,
} from "@phosphor-icons/react";
import { MenuGroups } from "@/components/list/menu-groups.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHeader } from "./todo-sheet-header.tsx";
import { copy } from "@/content/index.ts";

export function TodoRepeatMenu({ todo, now, finish, show }: TodoStepProps) {
  return (
    <>
      <TodoSheetHeader todo={todo} now={now} />
      <MenuGroups
        groups={[
          [
            {
              id: "done",
              icon: CheckIcon,
              title: copy.todo.doneForNow,
              variant: "primary",
              onClick: () => finish({ kind: "done" }),
            },
            {
              id: "skip",
              icon: SkipForwardIcon,
              title: copy.todo.skipThisTime,
              onClick: () => finish({ kind: "skip" }),
            },
          ],
          [
            {
              id: "edit",
              icon: PencilSimpleIcon,
              title: copy.common.edit,
              chevron: true,
              onClick: () => show("edit"),
            },
            {
              id: "stop",
              icon: RepeatOnceIcon,
              title: copy.todo.stopRepeating,
              onClick: () => finish({ kind: "stopRepeat" }),
            },
          ],
          [
            {
              id: "drop",
              icon: ArchiveIcon,
              title: copy.todo.archive,
              variant: "danger",
              chevron: true,
              onClick: () => show("drop"),
            },
          ],
        ]}
      />
    </>
  );
}
