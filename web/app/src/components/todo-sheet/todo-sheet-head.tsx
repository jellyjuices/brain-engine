import "./todo-sheet.css";
import { ClockIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Chip } from "@/components/chip/chip.tsx";
import { Icon } from "@/components/icon/icon.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { dueText } from "@/lib/notes/due.ts";
import type { TodoRef } from "@/lib/sync/local-edit.ts";

export interface TodoSheetHeadProps {
  todo: TodoRef;
  now: string;
  title?: string;
  onBack?: () => void;
}

export function TodoSheetHead({ todo, now, title, onBack }: TodoSheetHeadProps) {
  const late = !!todo.due && todo.due !== "someday" && todo.due < now;
  return (
    <SheetHead
      title={title ?? todo.text}
      quote={title && todo.text}
      onBack={onBack}
      context={
        <>
          <Chip size="sm">{todo.subject}</Chip>
          <span className={clsx("sheet-due", late && "is-late")}>
            <Icon icon={ClockIcon} />
            {dueText(todo.due, now)}
          </span>
        </>
      }
    />
  );
}
