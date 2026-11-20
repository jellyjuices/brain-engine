import { useEffect, useRef, useState } from "react";
import type { Option } from "./types.ts";

type Direction = "forward" | "back";

export function useMenuPath(open: boolean, onOpenChange: (open: boolean) => void) {
  const [path, setPath] = useState<Option[]>([]);
  const [direction, setDirection] = useState<Direction>("forward");
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) setPath([]);
  }, [open]);

  useEffect(() => {
    if (path.length || direction === "back")
      list.current?.querySelector<HTMLElement>("button")?.focus();
  }, [path, direction]);

  function pick(option: Option) {
    if (option.options) {
      setDirection("forward");
      setPath((p) => [...p, option]);
      return;
    }
    option.onSelect?.();
    onOpenChange(false);
  }

  function back() {
    setDirection("back");
    setPath((p) => p.slice(0, -1));
  }

  return { path, direction, list, current: path.at(-1), pick, back };
}
