import { useEffect, useState } from "react";
import { list, onOutboxChange, type OutboxItem } from "@/lib/sync/outbox.ts";

export function useOutboxItems(): OutboxItem[] {
  const [items, setItems] = useState<OutboxItem[]>([]);
  useEffect(() => {
    let alive = true;
    function load() {
      void list()
        .catch(() => [])
        .then((rows) => alive && setItems(rows));
    }
    load();
    const stop = onOutboxChange(load);
    return () => {
      alive = false;
      stop();
    };
  }, []);
  return items;
}
