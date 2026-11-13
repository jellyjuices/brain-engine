import { useEffect, useState } from "react";
import { canSummarize, type SummaryKind } from "@/lib/platform/summarizer.ts";

export function useCanSummarize(type: SummaryKind): boolean {
  const [able, setAble] = useState(false);
  useEffect(() => {
    let live = true;
    void canSummarize(type).then((ok) => live && setAble(ok));
    return () => {
      live = false;
    };
  }, [type]);
  return able;
}
