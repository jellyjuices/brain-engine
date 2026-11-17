import { useEffect, useRef } from "react";

export function useOnLeave(onLeave: () => void) {
  const latest = useRef(onLeave);

  useEffect(() => {
    latest.current = onLeave;
  });

  useEffect(() => {
    function leave() {
      latest.current();
    }
    function onHide() {
      if (document.visibilityState === "hidden") leave();
    }
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, []);
}
