import { useState } from "react";
import { summarize } from "@/lib/platform/summarizer.ts";

export function useSummary(text: string) {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    setBusy(true);
    const result = await summarize(text, "key-points");
    setBusy(false);
    setSummary(result);
    setFailed(!result);
  }

  return { busy, summary, failed, run };
}
