import { useEffect, useState } from "react";
import { fetchReport, type ReportResult } from "@/lib/sync/reports.ts";

export function useReport(name: string): { report: ReportResult | null; retry: () => void } {
  const [loaded, setLoaded] = useState<{ name: string; result: ReportResult } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    void fetchReport(name).then((result) => live && setLoaded({ name, result }));
    return () => {
      live = false;
    };
  }, [name, attempt]);
  function retry() {
    setLoaded(null);
    setAttempt((n) => n + 1);
  }
  return { report: loaded?.name === name ? loaded.result : null, retry };
}
