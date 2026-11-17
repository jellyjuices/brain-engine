import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

export const HOLD_MS = 400;
const PICK = '[role="menuitem"]';

function pickUnder(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(PICK) : null;
}

export function useHoldToPick(canStart: boolean, onHold: () => void, onMiss: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const eatClick = useRef(false);
  const stop = useRef<(() => void) | null>(null);
  const actions = useRef({ onHold, onMiss });

  useEffect(() => {
    actions.current = { onHold, onMiss };
  });

  useEffect(() => () => stop.current?.(), []);

  function end() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    held.current = false;
    stop.current?.();
    stop.current = null;
  }

  function handleMove(event: globalThis.PointerEvent) {
    if (held.current) pickUnder(event.target)?.focus();
  }

  function handleUp(event: globalThis.PointerEvent) {
    const wasHeld = held.current;
    end();
    if (!wasHeld) return;
    eatClick.current = true;
    const pick = pickUnder(event.target);
    if (pick) pick.click();
    else actions.current.onMiss();
  }

  function handleCancel() {
    const wasHeld = held.current;
    end();
    if (wasHeld) actions.current.onMiss();
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    eatClick.current = false;
    if (!canStart || !event.isPrimary || event.button !== 0) return;
    const button = event.currentTarget;
    if (button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
    end();
    timer.current = setTimeout(() => {
      held.current = true;
      actions.current.onHold();
    }, HOLD_MS);
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleCancel);
    stop.current = () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleCancel);
    };
  }

  function takeClick(): boolean {
    const eaten = eatClick.current;
    eatClick.current = false;
    return eaten;
  }

  function onContextMenu(event: MouseEvent<HTMLButtonElement>) {
    if (canStart || held.current) event.preventDefault();
  }

  return { onPointerDown, onContextMenu, takeClick };
}
