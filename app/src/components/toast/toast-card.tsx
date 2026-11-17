import { useRef, useState, type PointerEvent } from "react";
import clsx from "clsx";
import { closeToast, type ToastItem } from "./toast-store.ts";

const SWIPE_CLOSE = 64;

export function ToastCard({ item }: { item: ToastItem }) {
  const start = useRef<number | null>(null);
  const [dx, setDx] = useState(0);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (start.current === null) return;
    setDx(e.clientX - start.current);
  }

  function onPointerEnd() {
    if (start.current === null) return;
    start.current = null;
    if (Math.abs(dx) > SWIPE_CLOSE) closeToast(item.id);
    else setDx(0);
  }

  return (
    <div
      className={clsx(
        "toast",
        item.actions.length > 0 && "toast--action",
        item.tone && `toast--${item.tone}`,
        item.leaving && "leaving",
        dx !== 0 && "is-dragging",
      )}
      style={
        dx !== 0 && !item.leaving
          ? { translate: `${dx}px 0`, opacity: 1 - Math.min(Math.abs(dx) / 200, 0.7) }
          : undefined
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <span>{item.message}</span>
      {item.actions.map((action) => (
        <button
          key={action.label}
          className="toast-btn"
          type="button"
          onClick={() => {
            closeToast(item.id);
            action.onClick();
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
