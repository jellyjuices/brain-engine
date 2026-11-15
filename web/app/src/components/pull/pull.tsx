import { css } from "@linaria/core";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { copy } from "@/content/index.ts";

const TRIGGER = 72;

const dot = css`
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--background-accent);
`;

const pull = css`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  height: 0;
  margin: 0 calc(-1 * var(--space-lg));
  overflow: hidden;
  color: var(--text-secondary);
  font-size: var(--font-size-body-xs);

  @keyframes pulse {
    to {
      transform: scale(0.5);
      opacity: 0.4;
    }
  }
`;

const settlingStyle = css`
  .${pull}& {
    transition: height var(--motion-slow) var(--motion-easing);
  }
`;

const busyStyle = css`
  .${pull}& .${dot} {
    animation: pulse 700ms var(--motion-easing) infinite alternate;
  }
`;

export function Pull({ onRefresh }: { onRefresh: () => Promise<unknown> }) {
  const ref = useRef<HTMLDivElement>(null);
  const refresh = useRef(onRefresh);
  const [height, setHeight] = useState(0);
  const [label, setLabel] = useState(copy.nav.pullToRefresh);
  const [settling, setSettling] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refresh.current = onRefresh;
  });

  useEffect(() => {
    const el = ref.current;
    const scroller = el?.parentElement;
    if (!el || !scroller) return;
    let startY = 0;
    let pulling = false;
    let working = false;

    function onStart(e: TouchEvent) {
      if (working || scroller!.scrollTop > 0) return;
      startY = e.touches[0]!.clientY;
      pulling = true;
      setSettling(false);
    }
    function onMove(e: TouchEvent) {
      if (!pulling) return;
      const dy = e.touches[0]!.clientY - startY;
      if (dy <= 0 || scroller!.scrollTop > 0) return setHeight(0);
      if (e.cancelable) e.preventDefault();
      setHeight(Math.min(dy * 0.5, 96));
      setLabel(dy * 0.5 >= TRIGGER / 2 ? copy.nav.releaseToRefresh : copy.nav.pullToRefresh);
    }
    async function onEnd() {
      if (!pulling) return;
      pulling = false;
      setSettling(true);
      if (el!.offsetHeight < TRIGGER / 2) return setHeight(0);
      working = true;
      setBusy(true);
      setLabel(copy.nav.syncing);
      setHeight(40);
      await refresh.current().catch(() => undefined);
      working = false;
      setBusy(false);
      setLabel(copy.nav.pullToRefresh);
      setHeight(0);
    }
    function end() {
      void onEnd();
    }
    scroller.addEventListener("touchstart", onStart, { passive: true });
    scroller.addEventListener("touchmove", onMove, { passive: false });
    scroller.addEventListener("touchend", end);
    scroller.addEventListener("touchcancel", end);
    return () => {
      scroller.removeEventListener("touchstart", onStart);
      scroller.removeEventListener("touchmove", onMove);
      scroller.removeEventListener("touchend", end);
      scroller.removeEventListener("touchcancel", end);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(pull, settling && settlingStyle, busy && busyStyle)}
      style={{ height }}
      aria-hidden="true"
    >
      <span className={dot} />
      <span>{label}</span>
    </div>
  );
}
