import { useEffect, useState } from "react";
import { fetchIntakeQuestions, type IntakeResult } from "@/lib/sync/intake.ts";

export function useIntakeQuestions() {
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [finished, setFinished] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    void fetchIntakeQuestions().then((r) => live && setResult(r));
    return () => {
      live = false;
    };
  }, []);
  const current =
    result?.kind === "ready"
      ? result.questions.find((q) => !finished.includes(q.question))
      : undefined;
  function finish(question: string) {
    setFinished((old) => [...old, question]);
  }
  return { result, current, finish };
}
