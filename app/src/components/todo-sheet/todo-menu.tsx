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
import { Divider } from "@/components/row/divider.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import type { TodoRef } from "@/lib/sync/local-edit.ts";
import type { SheetResult, Step } from "./todo-sheet.tsx";
import { TodoSheetHead } from "./todo-sheet-head.tsx";
import { copy } from "@/content/index.ts";

export interface TodoStepProps {
  todo: TodoRef;
  now: string;
  finish: Finish<SheetResult>;
  show: (step: Step) => void;
}

export function TodoMenu({ todo, now, finish, show }: TodoStepProps) {
  const isEvent = todo.kind === "event";
  return (
    <>
      <TodoSheetHead todo={todo} now={now} />
      <List variant="menu">
        <Row
          icon={CheckIcon}
          title={copy.todo.done}
          variant="primary"
          chevron
          autoFocus
          onClick={() => show("done")}
        />
        <Divider />
        <Row
          icon={CalendarDotsIcon}
          title={copy.todo.setDate}
          chevron
          onClick={() => show("day")}
        />
        {!isEvent && (
          <>
            <Row
              icon={PencilSimpleIcon}
              title={copy.common.edit}
              chevron
              onClick={() => show("edit")}
            />
            <Row
              icon={HourglassIcon}
              title={copy.todo.putOnHold}
              chevron
              onClick={() => show("hold")}
            />
            <Row
              icon={MoonStarsIcon}
              title={copy.todo.moveToSomeday}
              onClick={() => finish({ kind: "move", when: "someday" })}
            />
          </>
        )}
        <Divider />
        <Row
          icon={InfoIcon}
          title={copy.todo.getDetails}
          chevron
          onClick={() => finish({ kind: "open" })}
        />
        <Divider />
        <Row
          icon={ArchiveIcon}
          title={isEvent ? copy.todo.cancelEvent : copy.todo.archive}
          variant="danger"
          chevron
          onClick={() => show("drop")}
        />
      </List>
    </>
  );
}
