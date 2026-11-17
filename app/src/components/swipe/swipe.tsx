import styles from "./swipe.module.css";
import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";

const THRESHOLD = 88;
const MAX = 150;
const COLLAPSE_MS = 200;

export interface SwipeAction {
  label: string;
  icon?: PhosphorIcon;
  away?: boolean;
  onSwipe: (collapse: () => Promise<void>) => Promise<unknown>;
}

export interface SwipeProps {
  right: SwipeAction;
  left: SwipeAction;
  onTap: (collapse: () => Promise<void>) => void;
  children: ReactNode;
}

function buzz() {
  navigator.vibrate?.(10);
}

export function Swipe({ right, left, onTap, children }: SwipeProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, startY: 0, dx: 0, mode: "idle", armed: false, swiped: false });
  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const [armed, setArmed] = useState(false);
  const [settling, setSettling] = useState(false);
  const [gone, setGone] = useState<number | null>(null);

  function collapse(): Promise<void> {
    return new Promise((resolve) => {
      setGone(wrap.current?.offsetHeight ?? 0);
      requestAnimationFrame(() => {
        setGone(0);
        setTimeout(resolve, COLLAPSE_MS);
      });
    });
  }

  function move(x: number | string) {
    if (main.current) main.current.style.transform = x ? `translateX(${x})` : "";
  }

  function reset() {
    setSettling(true);
    move(0);
    setDir(null);
    setArmed(false);
    drag.current.armed = false;
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    Object.assign(drag.current, { startX: e.clientX, startY: e.clientY, dx: 0, mode: "pending" });
    setSettling(false);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.mode === "idle" || d.mode === "scroll") return;
    const mx = e.clientX - d.startX;
    const my = e.clientY - d.startY;
    if (d.mode === "pending") {
      if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) {
        d.mode = "scroll";
        return;
      }
      if (Math.abs(mx) < 10) return;
      d.mode = "swipe";
      main.current?.setPointerCapture?.(e.pointerId);
    }
    d.dx = Math.max(-MAX, Math.min(MAX, mx));
    move(`${d.dx}px`);
    setDir(d.dx > 0 ? "right" : "left");
    const now = Math.abs(d.dx) >= THRESHOLD;
    if (now !== d.armed) {
      d.armed = now;
      setArmed(now);
      if (now) buzz();
    }
  }

  function onPointerUp() {
    const d = drag.current;
    const was = d.mode;
    d.mode = "idle";
    if (was !== "swipe") return;
    d.swiped = true;
    setTimeout(() => (d.swiped = false), 60);
    setArmed(false);
    if (!d.armed) return reset();
    buzz();
    const action = d.dx > 0 ? right : left;
    if (!action.away) {
      reset();
      void action.onSwipe(collapse);
      return;
    }
    setSettling(true);
    move(d.dx > 0 ? "100%" : "-100%");
    void action.onSwipe(collapse).finally(() => {
      if (wrap.current?.isConnected) reset();
    });
  }

  function onPointerCancel() {
    if (drag.current.mode === "swipe") reset();
    drag.current.mode = "idle";
  }

  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!drag.current.swiped) onTap(collapse);
  }

  function onContextMenu(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    if (drag.current.mode === "swipe" || drag.current.swiped) return;
    drag.current.mode = "idle";
    onTap(collapse);
  }

  return (
    <div
      ref={wrap}
      className={clsx(styles.swipe, gone === 0 && styles.isGone)}
      data-dir={dir ?? undefined}
      data-armed={armed || undefined}
      style={gone === null ? undefined : { height: gone }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
      onContextMenu={onContextMenu}
    >
      <div className={styles.swipeBg} aria-hidden="true">
        <span className={styles.swipeBgRight}>
          {right.icon && <Icon icon={right.icon} />}
          {right.label}
        </span>
        <span className={styles.swipeBgLeft}>
          {left.icon && <Icon icon={left.icon} />}
          {left.label}
        </span>
      </div>
      <div ref={main} className={clsx(styles.swipeMain, settling && styles.isSettling)}>
        {children}
      </div>
    </div>
  );
}
