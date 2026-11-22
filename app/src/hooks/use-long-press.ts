import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

const HOLD_MS = 500;
const SLOP = 8;
const ONCE_MS = 1000;

export function useLongPress(onLongPress?: () => void) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const origin = useRef({ x: 0, y: 0, fired: false });
  const lastFired = useRef(0);

  function cancel() {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function fire() {
    const now = Date.now();
    if (!onLongPress || now - lastFired.current < ONCE_MS) return;
    lastFired.current = now;
    onLongPress();
  }

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    if (!onLongPress || e.button !== 0 || (e.target as Element).closest('[role="checkbox"]'))
      return;
    origin.current = { x: e.clientX, y: e.clientY, fired: false };
    setHolding(true);
    timer.current = window.setTimeout(() => {
      origin.current.fired = true;
      cancel();
      fire();
    }, HOLD_MS);
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (timer.current === undefined) return;
    if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > SLOP) cancel();
  }

  function onClickCapture(e: MouseEvent<HTMLElement>) {
    if (!origin.current.fired) return;
    origin.current.fired = false;
    e.preventDefault();
    e.stopPropagation();
  }

  function onContextMenu(e: MouseEvent<HTMLElement>) {
    if (!onLongPress) return;
    e.preventDefault();
    cancel();
    fire();
  }

  return {
    holding,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onClickCapture,
      onContextMenu,
    },
    fire,
  };
}
