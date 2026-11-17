import { useEffect, useState } from "react";
import { fetchReport, type ReportResult } from "@/lib/sync/reports.ts";

export function useReport(name: string): ReportResult | null {
  const [loaded, setLoaded] = useState<{ name: string; result: ReportResult } | null>(null);
  useEffect(() => {
    let live = true;
    void fetchReport(name).then((result) => live && setLoaded({ name, result }));
    return () => {
      live = false;
    };
  }, [name]);
  return loaded?.name === name ? loaded.result : null;
}
