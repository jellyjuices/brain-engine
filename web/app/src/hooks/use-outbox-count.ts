import { useEffect, useState } from "react";
import { count, onOutboxChange } from "@/lib/sync/outbox.ts";

export function useOutboxCount(): number {
  const [waiting, setWaiting] = useState(0);
  useEffect(() => {
    let alive = true;
    function load() {
      void count()
        .catch(() => 0)
        .then((n) => alive && setWaiting(n));
    }
    load();
    const stop = onOutboxChange(load);
    return () => {
      alive = false;
      stop();
    };
  }, []);
  return waiting;
}
