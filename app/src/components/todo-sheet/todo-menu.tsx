import {
  ArchiveIcon,
  InfoIcon,
  CalendarDotsIcon,
  CheckIcon,
  HourglassIcon,
  MoonStarsIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import type { Finish } from "@/components/sheet/open-sheet.tsx";
import { MenuGroups } from "@/components/list/menu-groups.tsx";
import type { TodoRef } from "@/lib/sync/local-edit.ts";
import type { SheetResult, Step } from "./todo-sheet.tsx";
import { TodoSheetHeader } from "./todo-sheet-header.tsx";
import { copy } from "@/content/index.ts";

export interface TodoStepProps {
  todo: TodoRef;
  now: string;
  finish: Finish<SheetResult>;
  show: (step: Step) => void;
}

export function TodoMenu({ todo, now, finish, show }: TodoStepProps) {
  const isTodo = todo.kind !== "event";
  return (
    <>
      <TodoSheetHeader todo={todo} now={now} />
      <MenuGroups
        groups={[
          [
            {
              id: "done",
              icon: CheckIcon,
              title: copy.todo.done,
              variant: "primary",
              chevron: true,
              onClick: () => show("done"),
            },
          ],
          [
            {
              id: "day",
              icon: CalendarDotsIcon,
              title: copy.todo.setDate,
              chevron: true,
              onClick: () => show("day"),
            },
            isTodo && {
              id: "edit",
              icon: PencilSimpleIcon,
              title: copy.common.edit,
              chevron: true,
              onClick: () => show("edit"),
            },
            isTodo && {
              id: "hold",
              icon: HourglassIcon,
              title: copy.todo.putOnHold,
              chevron: true,
              onClick: () => show("hold"),
            },
            isTodo && {
              id: "someday",
              icon: MoonStarsIcon,
              title: copy.todo.moveToSomeday,
              onClick: () => finish({ kind: "move", when: "someday" }),
            },
          ],
          [
            {
              id: "open",
              icon: InfoIcon,
              title: copy.todo.getDetails,
              chevron: true,
              onClick: () => finish({ kind: "open" }),
            },
          ],
          [
            {
              id: "drop",
              icon: ArchiveIcon,
              title: isTodo ? copy.todo.archive : copy.todo.cancelEvent,
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
