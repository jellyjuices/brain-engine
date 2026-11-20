import clsx from "clsx";
import { CalendarDotsIcon, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { Ref } from "react";
import styles from "./todo-row.module.css";
import { copy } from "@/content/index.ts";

export function laterAction(onSelect: () => void): TodoRowAction {
  return {
    id: "later",
    label: copy.todo.swipeLater,
    icon: CalendarDotsIcon,
    tone: "later",
    onSelect,
  };
}

export type TodoRowAction = {
  id: string;
  label: string;
  icon: PhosphorIcon;
  tone?: "later" | "sort" | "delete";
  onSelect: () => void;
};

export type TodoRowActionsProps = {
  actions: TodoRowAction[];
  ref: Ref<HTMLDivElement>;
  onFocus: () => void;
  onRun: (fn: () => void) => void;
};

const tones = {
  later: styles.actionLater,
  sort: styles.actionSort,
  delete: styles.actionDelete,
} satisfies Record<NonNullable<TodoRowAction["tone"]>, string | undefined>;

export function TodoRowActions({ actions, ref, onFocus, onRun }: TodoRowActionsProps) {
  return (
    <div ref={ref} className={styles.actions}>
      {actions.map(({ id, label, icon: ActionIcon, tone = "sort", onSelect }) => (
        <button
          key={id}
          type="button"
          className={clsx(styles.action, tones[tone])}
          onFocus={onFocus}
          onClick={() => onRun(onSelect)}
        >
          <span className={styles.actionInner}>
            <ActionIcon aria-hidden />
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
