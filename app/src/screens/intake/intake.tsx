import "./intake.css";
import { useState } from "react";
import { Empty } from "@/components/empty/empty.tsx";
import { Panel } from "@/components/panel/panel.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import {
  laterIntakeQuestion,
  saveIntakeAnswer,
  shortenAnswer,
  type IntakeDraft,
} from "@/flows/intake-flow.ts";
import { useIntakeQuestions } from "@/hooks/use-intake-questions.ts";
import { copy } from "@/content/index.ts";
import { IntakeAnswer } from "./intake-answer.tsx";
import { IntakeCheck } from "./intake-check.tsx";

export function IntakeScreen() {
  const { result, current, finish } = useIntakeQuestions();
  const [answer, setAnswer] = useState("");
  const [draft, setDraft] = useState<IntakeDraft | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(work: () => Promise<boolean>) {
    if (!current) return;
    setBusy(true);
    const ok = await work();
    setBusy(false);
    if (!ok) return;
    finish(current.question);
    setAnswer("");
    setDraft(null);
  }

  async function next() {
    setBusy(true);
    setDraft(await shortenAnswer(answer));
    setBusy(false);
  }

  return (
    <>
      <PageHeader title={copy.nav.intake} fallback="/new" />
      {result?.kind === "offline" && (
        <Empty title={copy.intake.offlineTitle} body={copy.intake.offlineBody} />
      )}
      {result?.kind === "ready" && !current && (
        <Empty title={copy.intake.noneTitle} body={copy.intake.noneBody} />
      )}
      {current && (
        <>
          <Panel>
            <p className="intake-question serif">{current.question}</p>
          </Panel>
          {draft ? (
            <IntakeCheck
              line={draft.line}
              busy={busy}
              onChange={(line) => setDraft({ ...draft, line })}
              onBack={() => setDraft(null)}
              onSave={() => void run(() => saveIntakeAnswer(current, draft))}
            />
          ) : (
            <IntakeAnswer
              answer={answer}
              busy={busy}
              onChange={setAnswer}
              onLater={() => void run(() => laterIntakeQuestion(current.question))}
              onNext={() => void next()}
            />
          )}
        </>
      )}
    </>
  );
}
