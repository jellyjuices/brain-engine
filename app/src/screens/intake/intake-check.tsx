import styles from "./intake.module.css";
import { Button } from "@/components/button/button.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { copy } from "@/content/index.ts";

export function IntakeCheck({
  line,
  busy,
  onChange,
  onBack,
  onSave,
}: {
  line: string;
  busy: boolean;
  onChange: (line: string) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <div className={styles.intakeStep}>
      <TextField label={copy.intake.line} multiline value={line} onChange={onChange} />
      <p className={styles.intakeHint}>{copy.intake.lineHint}</p>
      <div className={styles.intakeActions}>
        <SheetActions>
          <Button variant="outlined" disabled={busy} onClick={onBack}>
            {copy.common.back}
          </Button>
          <Button busy={busy} disabled={!line.trim()} onClick={onSave}>
            {copy.common.save}
          </Button>
        </SheetActions>
      </div>
    </div>
  );
}
