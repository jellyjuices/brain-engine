import { css } from "@linaria/core";
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

const due = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-secondary);
  font-size: var(--font-size-body-xs);

  & svg {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
  }
`;

const dueLate = css`
  .${due}& {
    color: var(--text-danger);
    font-weight: var(--font-weight-semibold);
  }
`;

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
          <span className={clsx(due, late && dueLate)}>
            <Icon icon={ClockIcon} />
            {dueText(todo.due, now)}
          </span>
        </>
      }
    />
  );
}
