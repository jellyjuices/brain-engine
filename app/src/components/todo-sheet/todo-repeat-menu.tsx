import {
  ArchiveIcon,
  CheckIcon,
  PencilSimpleIcon,
  RepeatOnceIcon,
  SkipForwardIcon,
} from "@phosphor-icons/react";
import { Divider } from "@/components/row/divider.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHead } from "./todo-sheet-head.tsx";
import { copy } from "@/content/index.ts";

export function TodoRepeatMenu({ todo, now, finish, show }: TodoStepProps) {
  return (
    <>
      <TodoSheetHead todo={todo} now={now} />
      <List variant="menu">
        <Row
          icon={CheckIcon}
          title={copy.todo.doneForNow}
          variant="primary"
          autoFocus
          onClick={() => finish({ kind: "done" })}
        />
        <Row
          icon={SkipForwardIcon}
          title={copy.todo.skipThisTime}
          onClick={() => finish({ kind: "skip" })}
        />
        <Divider />
        <Row
          icon={PencilSimpleIcon}
          title={copy.common.edit}
          chevron
          onClick={() => show("edit")}
        />
        <Row
          icon={RepeatOnceIcon}
          title={copy.todo.stopRepeating}
          onClick={() => finish({ kind: "stopRepeat" })}
        />
        <Divider />
        <Row
          icon={ArchiveIcon}
          title={copy.todo.archive}
          variant="danger"
          chevron
          onClick={() => show("drop")}
        />
      </List>
    </>
  );
}
