import clsx from "clsx";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { WhenChipProps } from "../when-chip/when-chip.tsx";
import { TodoRowActions, type TodoRowAction } from "./todo-row-actions.tsx";
import { TodoRowMeta, hasMeta } from "./todo-row-meta.tsx";
import { useLongPress } from "./use-long-press.ts";
import { useSwipe } from "./use-swipe.ts";
import styles from "./todo-row.module.css";

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
  start?: ReactNode;
  actions?: TodoRowAction[];
  surface?: "primary" | "secondary";
  checked?: boolean;
  disabled?: boolean;
  pressed?: boolean;
  defaultSwiped?: boolean;
  onOpen?: () => void;
  onMenu?: () => void;
};

const noActions: TodoRowAction[] = [];

function isMenuKey(e: KeyboardEvent) {
  return e.key === "ContextMenu" || (e.shiftKey && e.key === "F10");
}

export function TodoRow(props: TodoRowProps) {
  const { title, start, actions = noActions, surface = "primary", checked, disabled } = props;
  const { pressed, defaultSwiped, onOpen, onMenu } = props;
  const tray = useRef<HTMLDivElement>(null);
  const swipeable = !disabled && actions.length > 0;
  const measure = useCallback(() => tray.current?.offsetWidth ?? 0, []);
  const swipe = useSwipe(measure, !swipeable);
  const menu = disabled ? undefined : onMenu;
  const hold = useLongPress(menu);

  useLayoutEffect(() => {
    if (defaultSwiped) swipe.open();
  }, [defaultSwiped, swipe.open]);

  function run(fn: () => void) {
    swipe.close();
    fn();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") swipe.close();
    if (menu && isMenuKey(e)) {
      e.preventDefault();
      menu();
    }
  }

  function onContextMenu(e: MouseEvent<HTMLDivElement>) {
    if (!menu) return;
    e.preventDefault();
    menu();
  }

  const s = swipe.handlers;
  const h = hold.handlers;
  const style = {
    "--offset": `${swipe.offset}px`,
    "--progress": swipe.progress,
  } as CSSProperties;

  return (
    <div
      className={clsx(
        styles.row,
        styles[surface],
        checked && styles.isDone,
        disabled && styles.isDisabled,
        swipe.dragging && styles.isDragging,
        swipe.offset !== 0 && styles.isSwiped,
        (pressed || hold.holding) && styles.isPressed,
      )}
      style={style}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
    >
      {swipeable && (
        <TodoRowActions actions={actions} ref={tray} onFocus={swipe.open} onRun={run} />
      )}
      <div
        className={styles.content}
        onPointerDown={(e) => {
          s.onPointerDown(e);
          h.onPointerDown(e);
        }}
        onPointerMove={(e) => {
          s.onPointerMove(e);
          h.onPointerMove(e);
        }}
        onPointerUp={() => {
          s.onPointerUp();
          h.onPointerUp();
        }}
        onPointerCancel={() => {
          s.onPointerCancel();
          h.onPointerCancel();
        }}
        onClickCapture={(e) => {
          h.onClickCapture(e);
          s.onClickCapture(e);
        }}
      >
        {start && <span className={styles.start}>{start}</span>}
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
            <span className={styles.title}>{title}</span>
          )}
          {hasMeta(props) && <TodoRowMeta {...props} />}
        </div>
      </div>
    </div>
  );
}
