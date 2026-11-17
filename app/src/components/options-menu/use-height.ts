import { useCallback, useRef, useState } from "react";

export const useHeight = () => {
  const observer = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState<number>();

  const inner = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!el) return;
    setHeight(el.offsetHeight);
    observer.current = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.current.observe(el);
  }, []);

  return { inner, height };
};
