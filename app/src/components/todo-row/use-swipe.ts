import { useCallback, useMemo, useRef, useState, type PointerEvent, type MouseEvent } from "react";

const slop = 8;

export const useSwipe = (measure: () => number, disabled?: boolean) => {
  const [offset, setOffsetState] = useState(0);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const start = useRef({ x: 0, y: 0, base: 0, width: 0, active: false, moved: false });

  const setOffset = useCallback((next: number) => {
    offsetRef.current = next;
    setOffsetState(next);
  }, []);

  const open = useCallback(() => {
    const full = measure();
    setWidth(full);
    setOffset(-full);
  }, [measure, setOffset]);
  const close = useCallback(() => setOffset(0), [setOffset]);

  const handlers = useMemo(() => {
    function onPointerUp() {
      const s = start.current;
      if (!s.active) return;
      s.active = false;
      if (!s.moved) return;
      setDragging(false);
      setOffset(offsetRef.current < -s.width / 2 ? -s.width : 0);
    }
    return {
      onPointerDown(e: PointerEvent<HTMLElement>) {
        if (disabled || e.button !== 0) return;
        const full = measure();
        setWidth(full);
        start.current = {
          x: e.clientX,
          y: e.clientY,
          base: offsetRef.current,
          width: full,
          active: true,
          moved: false,
        };
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        const s = start.current;
        if (!s.active) return;
        const dx = e.clientX - s.x;
        if (!s.moved) {
          if (Math.abs(dx) < slop || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
          s.moved = true;
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        setOffset(Math.max(-s.width, Math.min(0, s.base + dx)));
      },
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture(e: MouseEvent<HTMLElement>) {
        if (!start.current.moved && offsetRef.current === 0) return;
        start.current.moved = false;
        e.preventDefault();
        e.stopPropagation();
        if (offsetRef.current !== 0) setOffset(0);
      },
    };
  }, [disabled, measure, setOffset]);

  const progress = width > 0 ? Math.min(1, -offset / width) : 0;
  return { offset, progress, dragging, open, close, handlers };
};
