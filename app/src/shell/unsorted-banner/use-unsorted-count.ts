import { useEffect, useState } from "react";
import { api } from "@/lib/sync/api.ts";

interface UnsortedReply {
  count?: unknown;
}

export function useUnsortedCount(active: boolean, routeKey: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let live = true;
    void api<UnsortedReply>("/api/unsorted").then((reply) => {
      if (live && reply.ok && typeof reply.data.count === "number") setCount(reply.data.count);
    });
    return () => {
      live = false;
    };
  }, [active, routeKey]);

  return active ? count : 0;
}
