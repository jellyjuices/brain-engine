import { useEffect, useState } from "react";
import type { StoredNote } from "@/lib/notes/model.ts";
import { allNotes, onStoreChange } from "@/lib/storage/store.ts";

export function useNotes(): StoredNote[] | null {
  const [notes, setNotes] = useState<StoredNote[] | null>(null);
  useEffect(() => {
    let alive = true;
    function load() {
      void allNotes().then((next) => alive && setNotes(next));
    }
    load();
    const stop = onStoreChange(load);
    return () => {
      alive = false;
      stop();
    };
  }, []);
  return notes;
}
