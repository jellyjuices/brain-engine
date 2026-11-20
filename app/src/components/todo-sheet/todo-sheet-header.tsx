import styles from "./todo-sheet-header.module.css";
import { ClockIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Chip } from "@/components/chip/chip.tsx";
import { Icon } from "@/components/icon/icon.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { dueText } from "@/lib/notes/due.ts";
import type { TodoRef } from "@/lib/sync/local-edit.ts";

export interface TodoSheetHeaderProps {
  todo: TodoRef;
  now: string;
  title?: string;
  onBack?: () => void;
}

export function TodoSheetHeader({ todo, now, title, onBack }: TodoSheetHeaderProps) {
  const late = !!todo.due && todo.due !== "someday" && todo.due < now;
  return (
    <SheetHead
      title={title ?? todo.text}
      quote={title && todo.text}
      onBack={onBack}
      context={
        <>
          <Chip label={todo.subject} />
          <span className={clsx(styles.sheetDue, late && styles.isLate)}>
            <Icon icon={ClockIcon} />
            {dueText(todo.due, now)}
          </span>
        </>
      }
    />
  );
}
