import { useEffect, useRef, type RefObject } from "react";

const GRIP_ZONE = 32;

export function useSwipeToClose(panelRef: RefObject<HTMLElement | null>, close: () => void) {
  const onClose = useRef(close);
  useEffect(() => {
    onClose.current = close;
  });

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let startY = 0;
    let startT = 0;
    let dy = 0;
    let tracking = false;
    let dragging = false;

    function begin(y: number) {
      startY = y;
      startT = performance.now();
      dy = 0;
      tracking = true;
      dragging = false;
    }

    function move(y: number): boolean {
      if (!tracking) return false;
      dy = y - startY;
      if (!dragging) {
        if (dy < -6) tracking = false;
        else if (dy > 6 && panel!.scrollTop <= 0) {
          dragging = true;
          startY = y;
          dy = 0;
          panel!.style.transition = "none";
          panel!.style.animation = "none";
        }
        return false;
      }
      panel!.style.transform = `translateY(${Math.max(0, dy)}px)`;
      return true;
    }

    function end() {
      if (!tracking) return;
      tracking = false;
      if (!dragging) return;
      dragging = false;
      const speed = dy / Math.max(1, performance.now() - startT);
      panel!.style.transition = "transform var(--motion-fast) var(--motion-easing)";
      if (dy > panel!.offsetHeight * 0.25 || (dy > 24 && speed > 0.5)) {
        panel!.style.transform = "translateY(100%)";
        onClose.current();
      } else {
        panel!.style.transform = "";
      }
    }

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      if (t && e.touches.length === 1) begin(t.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t && move(t.clientY) && e.cancelable) e.preventDefault();
    }
    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (e.clientY - panel!.getBoundingClientRect().top > GRIP_ZONE) return;
      begin(e.clientY);
      panel!.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === "mouse") move(e.clientY);
    }
    function onPointerEnd(e: PointerEvent) {
      if (e.pointerType === "mouse") end();
    }

    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });
    panel.addEventListener("touchend", end);
    panel.addEventListener("touchcancel", end);
    panel.addEventListener("pointerdown", onPointerDown);
    panel.addEventListener("pointermove", onPointerMove);
    panel.addEventListener("pointerup", onPointerEnd);
    panel.addEventListener("pointercancel", onPointerEnd);
    return () => {
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
      panel.removeEventListener("touchend", end);
      panel.removeEventListener("touchcancel", end);
      panel.removeEventListener("pointerdown", onPointerDown);
      panel.removeEventListener("pointermove", onPointerMove);
      panel.removeEventListener("pointerup", onPointerEnd);
      panel.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [panelRef]);
}
