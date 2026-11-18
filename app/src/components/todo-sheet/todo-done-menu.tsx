import { ArrowCounterClockwiseIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Divider } from "@/components/row/divider.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import type { TodoStepProps } from "./todo-menu.tsx";
import { TodoSheetHead } from "./todo-sheet-head.tsx";
import { copy } from "@/content/index.ts";

export function TodoDoneMenu({ todo, now, finish, show }: TodoStepProps) {
  return (
    <>
      <TodoSheetHead todo={todo} now={now} />
      <List variant="menu">
        <Row
          icon={ArrowCounterClockwiseIcon}
          title={copy.todo.markNotDone}
          variant="primary"
          autoFocus
          onClick={() => finish({ kind: "reopen" })}
        />
        <Row
          icon={PencilSimpleIcon}
          title={copy.common.edit}
          chevron
          onClick={() => show("edit")}
        />
        <Divider />
        <Row
          icon={TrashIcon}
          title={copy.todo.archive}
          variant="danger"
          onClick={() => finish({ kind: "drop" })}
        />
      </List>
    </>
  );
}
