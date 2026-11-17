import { useLayoutEffect, useRef, useState } from "react";

export const usePill = (value: string) => {
  const list = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ x: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>('[data-state="active"]');
      if (active) setBox(() => ({ x: active.offsetLeft, width: active.offsetWidth, ready: true }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return { list, box };
};
