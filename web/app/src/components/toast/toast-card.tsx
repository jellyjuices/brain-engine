import { useRef, useState, type PointerEvent } from "react";
import clsx from "clsx";
import { css } from "@linaria/core";
import { closeToast, type ToastItem } from "./toast-store.ts";

const SWIPE_CLOSE = 64;

const toastButton = css`
  min-height: 36px;
  margin: calc(var(--radius-sm) * -1) calc(var(--space-sm) * -1) calc(var(--radius-sm) * -1) 0;
  padding: 0 var(--space-md);
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-on-accent);
  font-weight: var(--font-weight-semibold);
`;

const toast = css`
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  pointer-events: auto;
  max-width: 480px;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--text-primary);
  color: var(--background-primary);
  font-size: var(--font-size-body-sm);
  box-shadow: var(--shadow-raised);
  touch-action: pan-y;
  user-select: none;
  transition:
    translate var(--motion-fast) var(--motion-easing),
    opacity var(--motion-fast) var(--motion-easing);
  animation: toast-in var(--motion-slow) var(--motion-easing) both;

  & .${toastButton} {
    color: color-mix(in srgb, var(--background-primary) 70%, var(--text-accent));
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(var(--space-md));
    }
  }

  @keyframes toast-out {
    to {
      opacity: 0;
      transform: translateY(var(--space-sm));
    }
  }
`;

const withAction = css`
  .${toast}& {
    padding-right: var(--space-lg);
  }
`;

const dragging = css`
  .${toast}& {
    transition: none;
  }
`;

const leaving = css`
  .${toast}& {
    animation: toast-out var(--motion-fast) var(--motion-easing) both;
  }
`;

const tones = {
  offline: css`
    --toast-bg: color-mix(in srgb, var(--status-late) 18%, var(--background-secondary));

    .${toast}& {
      background: var(--toast-bg);
      color: var(--status-late);
    }

    .${toast}& .${toastButton} {
      color: inherit;
      text-decoration: underline;
    }
  `,
  error: css`
    --toast-bg: color-mix(in srgb, var(--text-danger) 18%, var(--background-secondary));

    .${toast}& {
      background: var(--toast-bg);
      color: var(--text-danger);
    }

    .${toast}& .${toastButton} {
      color: inherit;
      text-decoration: underline;
    }
  `,
};

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
        toast,
        item.action && withAction,
        item.tone && tones[item.tone],
        item.leaving && leaving,
        dx !== 0 && dragging,
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
      {item.action && (
        <button
          className={toastButton}
          type="button"
          onClick={() => {
            closeToast(item.id);
            item.action?.onClick();
          }}
        >
          {item.action.label}
        </button>
      )}
    </div>
  );
}
