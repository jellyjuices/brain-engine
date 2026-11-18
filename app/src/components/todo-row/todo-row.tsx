import clsx from "clsx";
import { useId, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Checkbox } from "radix-ui";
import { CalendarDotsIcon, CheckIcon, FunnelSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import type { WhenChipProps } from "../when-chip/when-chip.tsx";
import { TodoRowMeta, hasMeta } from "./todo-row-meta.tsx";
import { useLongPress } from "./use-long-press.ts";
import { useSwipe } from "./use-swipe.ts";
import hit from "../hit-area/hit-area.module.css";
import styles from "./todo-row.module.css";
import { copy } from "@/content/index.ts";

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
  onLater?: () => void;
  sortLabel?: string;
  dropLabel?: string;
  laterLabel?: string;
};

function isMenuKey(e: KeyboardEvent) {
  return e.key === "ContextMenu" || (e.shiftKey && e.key === "F10");
}

function both<E>(a: (e: E) => void, b: (e: E) => void) {
  return (e: E) => {
    a(e);
    b(e);
  };
}

export function TodoRow(props: TodoRowProps) {
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
    onLater,
  } = props;
  const { sortLabel = "Sort", dropLabel = "Delete", laterLabel = copy.todo.swipeLater } = props;
  const id = useId();
  const actions = [onLater, onSort, onDrop].filter(Boolean).length;
  const tray = useRef<HTMLDivElement>(null);
  const swipe = useSwipe(() => tray.current?.offsetWidth ?? 0, disabled || actions === 0);
  const hold = useLongPress(disabled ? undefined : onMenu);
  function run(fn?: () => void) {
    return () => {
      swipe.close();
      fn?.();
    };
  }

  useLayoutEffect(() => {
    if (defaultSwiped) swipe.open();
  }, [defaultSwiped]);

  const content = {
    onPointerDown: both(swipe.handlers.onPointerDown, hold.handlers.onPointerDown),
    onPointerMove: both(swipe.handlers.onPointerMove, hold.handlers.onPointerMove),
    onPointerUp: both(swipe.handlers.onPointerUp, hold.handlers.onPointerUp),
    onPointerCancel: both(swipe.handlers.onPointerCancel, hold.handlers.onPointerCancel),
    onClickCapture: both(hold.handlers.onClickCapture, swipe.handlers.onClickCapture),
  };

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") swipe.close();
    if (onMenu && !disabled && isMenuKey(e)) {
      e.preventDefault();
      onMenu();
    }
  }

  return (
    <div
      className={clsx(
        styles.row,
        checked && styles.isDone,
        disabled && styles.isDisabled,
        swipe.dragging && styles.isDragging,
        swipe.offset !== 0 && styles.isSwiped,
        (pressed || hold.holding) && styles.isPressed,
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
          {onLater && (
            <button
              type="button"
              className={clsx(styles.action, styles.actionLater)}
              onFocus={swipe.open}
              onClick={run(onLater)}
            >
              <CalendarDotsIcon aria-hidden />
              {laterLabel}
            </button>
          )}
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
          className={clsx(styles.tick, hit.area)}
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
    </div>
  );
}
