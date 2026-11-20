import { saveFlow } from "@/flows/save-flow.ts";
import { summarize } from "@/lib/platform/summarizer.ts";
import { queueIntakeSave, queueIntakeSkip } from "@/lib/sync/writes.ts";
import type { IntakeQuestion } from "@/lib/sync/intake.ts";
import { copy } from "@/content/index.ts";
import { undoSaved } from "./undo-flow.ts";

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
  let itemId = "";
  return saveFlow(
    async () => {
      const item = await queueIntakeSave({
        lens: q.lens,
        question: q.question,
        line,
        raw: draft.answer.trim(),
        by: draft.summary !== null && line === draft.summary ? "gemini-nano" : "owner",
      });
      itemId = item.id;
      return item;
    },
    {
      message: copy.toast.saved,
      action: { label: copy.common.undo, onClick: () => void undoSaved(itemId) },
    },
  );
}

export function laterIntakeQuestion(question: string): Promise<boolean> {
  return saveFlow(() => queueIntakeSkip(question), copy.intake.laterDone);
}
