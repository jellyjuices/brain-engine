import { saveFlow } from "@/flows/save-flow.ts";
import { lensLabel } from "@/lib/notes/lens-label.ts";
import { summarize } from "@/lib/platform/summarizer.ts";
import { queueIntakeSave, queueIntakeSkip } from "@/lib/sync/writes.ts";
import type { IntakeQuestion } from "@/lib/sync/intake.ts";
import { copy } from "@/content/index.ts";

export interface IntakeDraft {
  answer: string;
  line: string;
  summary: string | null;
}

export async function shortenAnswer(answer: string): Promise<IntakeDraft> {
  const summary = await summarize(answer, "tldr");
  return { answer, line: summary ?? answer.trim(), summary };
}

export function saveIntakeAnswer(q: IntakeQuestion, draft: IntakeDraft): Promise<boolean> {
  const line = draft.line.trim();
  return saveFlow(
    async () => {
      const item = await queueIntakeSave({
        lens: q.lens,
        question: q.question,
        line,
        raw: draft.answer.trim(),
        by: draft.summary !== null && line === draft.summary ? "gemini-nano" : "owner",
      });
      return item;
    },
    copy.toast.savedTo(lensLabel(q.lens)),
  );
}

export function laterIntakeQuestion(question: string): Promise<boolean> {
  return saveFlow(() => queueIntakeSkip(question), copy.intake.laterDone);
}
