import styles from "./intake.module.css";
import { TextArea } from "@/components/field/text-area.tsx";
import { Button } from "@/components/button/button.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { copy } from "@/content/index.ts";

export function IntakeAnswer({
  answer,
  busy,
  onChange,
  onLater,
  onNext,
}: {
  answer: string;
  busy: boolean;
  onChange: (answer: string) => void;
  onLater: () => void;
  onNext: () => void;
}) {
  return (
    <div className={styles.intakeStep}>
      <TextArea
        placeholder={copy.intake.answerPlaceholder}
        aria-label={copy.intake.answer}
        autoCapitalize="sentences"
        value={answer}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className={styles.intakeActions}>
        <SheetActions>
          <Button variant="outlined" disabled={busy} onClick={onLater}>
            {copy.intake.later}
          </Button>
          <Button busy={busy} disabled={!answer.trim()} onClick={onNext}>
            {busy ? copy.intake.shortening : copy.intake.next}
          </Button>
        </SheetActions>
      </div>
    </div>
  );
}
