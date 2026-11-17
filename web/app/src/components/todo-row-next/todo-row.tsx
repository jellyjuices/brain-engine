import clsx from "clsx";
import { useId, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Checkbox } from "radix-ui";
import { CheckIcon, FunnelSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import type { WhenChipProps } from "../when-chip/when-chip.tsx";
import { TodoRowMeta, hasMeta } from "./todo-row-meta.tsx";
import { useLongPress } from "./use-long-press.ts";
import { useSwipe } from "./use-swipe.ts";
import { hitArea } from "../hit-area/hit-area.ts";
import * as styles from "./todo-row.styles.ts";
import * as states from "./todo-row-states.styles.ts";

export type TodoRowProps = {
  title: string;
  tag?: string;
  areas?: string[];
  when?: WhenChipProps;
  people?: string[];
  goal?: string;
  goalAreas?: string[];
  check?: boolean;
  checkLabel?: string;
  from?: string;
  markLabels?: { people?: string; goal?: string; from?: string };
  checked?: boolean;
  disabled?: boolean;
  pressed?: boolean;
  defaultSwiped?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onOpen?: () => void;
  onMenu?: () => void;
  onSort?: () => void;
  onDrop?: () => void;
  sortLabel?: string;
  dropLabel?: string;
};

const isMenuKey = (e: KeyboardEvent) => e.key === "ContextMenu" || (e.shiftKey && e.key === "F10");

export const TodoRow = (props: TodoRowProps) => {
  const {
    title,
    checked,
    disabled,
    pressed,
    defaultSwiped,
    onCheckedChange,
    onOpen,
    onMenu,
    onSort,
    onDrop,
  } = props;
  const { sortLabel = "Sort", dropLabel = "Delete" } = props;
  const id = useId();
  const actions = [onSort, onDrop].filter(Boolean).length;
  const tray = useRef<HTMLDivElement>(null);
  const swipe = useSwipe(() => tray.current?.offsetWidth ?? 0, disabled || actions === 0);
  const hold = useLongPress(disabled ? undefined : onMenu);
  const run = (fn?: () => void) => () => {
    swipe.close();
    fn?.();
  };

  useLayoutEffect(() => {
    if (defaultSwiped) swipe.open();
  }, [defaultSwiped]);

  const both =
    <E,>(a: (e: E) => void, b: (e: E) => void) =>
    (e: E) => {
      a(e);
      b(e);
    };
  const content = {
    onPointerDown: both(swipe.handlers.onPointerDown, hold.handlers.onPointerDown),
    onPointerMove: both(swipe.handlers.onPointerMove, hold.handlers.onPointerMove),
    onPointerUp: both(swipe.handlers.onPointerUp, hold.handlers.onPointerUp),
    onPointerCancel: both(swipe.handlers.onPointerCancel, hold.handlers.onPointerCancel),
    onClickCapture: both(hold.handlers.onClickCapture, swipe.handlers.onClickCapture),
  };

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key === "Escape") swipe.close();
    if (onMenu && !disabled && isMenuKey(e)) {
      e.preventDefault();
      onMenu();
    }
  };

  return (
    <li
      className={clsx(
        styles.row,
        checked && states.isDone,
        disabled && states.isDisabled,
        swipe.dragging && states.isDragging,
        (pressed || hold.holding) && states.isPressed,
      )}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => {
        if (!onMenu || disabled) return;
        e.preventDefault();
        onMenu();
      }}
    >
      {actions > 0 && !disabled && (
        <div ref={tray} className={styles.actions}>
          {onSort && (
            <button
              type="button"
              className={clsx(styles.action, styles.actionSort)}
              onFocus={swipe.open}
              onClick={run(onSort)}
            >
              <FunnelSimpleIcon aria-hidden />
              {sortLabel}
            </button>
          )}
          {onDrop && (
            <button
              type="button"
              className={clsx(styles.action, styles.actionDrop)}
              onFocus={swipe.open}
              onClick={run(onDrop)}
            >
              <TrashIcon aria-hidden />
              {dropLabel}
            </button>
          )}
        </div>
      )}
      <div
        className={styles.content}
        style={{ transform: `translateX(${swipe.offset}px)` }}
        {...content}
      >
        <Checkbox.Root
          id={id}
          className={clsx(styles.tick, hitArea)}
          checked={checked}
          disabled={disabled}
          aria-label={onOpen ? title : undefined}
          onCheckedChange={(value) => onCheckedChange?.(value === true)}
        >
          <Checkbox.Indicator className={styles.mark}>
            <CheckIcon weight="bold" aria-hidden />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <div className={styles.body}>
          {onOpen ? (
            <button
              type="button"
              className={clsx(styles.title, styles.open)}
              onClick={onOpen}
              disabled={disabled}
            >
              {title}
            </button>
          ) : (
            <label htmlFor={id} className={styles.title}>
              {title}
            </label>
          )}
          {hasMeta(props) && <TodoRowMeta {...props} />}
        </div>
      </div>
    </li>
  );
};
