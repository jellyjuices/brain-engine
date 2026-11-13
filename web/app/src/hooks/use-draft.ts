import { useRef } from "react";
import { DRAFT_MS, storeDraft } from "@/lib/storage/drafts.ts";
import { useOnLeave } from "./use-on-leave.ts";

export function useDraft<T>(id: string, onLeave: () => void) {
  const timer = useRef<number | undefined>(undefined);
  useOnLeave(() => {
    window.clearTimeout(timer.current);
    onLeave();
  });
  return {
    keep(value: T) {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void storeDraft(id, value), DRAFT_MS);
    },
    drop() {
      window.clearTimeout(timer.current);
      void storeDraft(id, null);
    },
  };
}
