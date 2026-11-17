import { useEffect, useRef } from "react";
import { openLayer } from "@/lib/platform/back-stack.ts";

export function useBackLayer(open: boolean, onBack: () => void): () => void {
  const latest = useRef(onBack);
  const release = useRef<(() => void) | null>(null);

  useEffect(() => {
    latest.current = onBack;
  });

  useEffect(() => {
    if (!open) return;
    const own = openLayer(() => latest.current());
    release.current = own;
    return () => {
      own();
      if (release.current === own) release.current = null;
    };
  }, [open]);

  return function releaseNow() {
    release.current?.();
    release.current = null;
  };
}
