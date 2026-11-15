import { Button } from "@ds/components/button/button.tsx";
import { DayPicker } from "@/components/day-picker/day-picker.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { Chip } from "@/components/chip/chip.tsx";
import { quickChoices, type QuickId } from "@/lib/notes/due.ts";
import { copy } from "@/content/index.ts";

export interface WhenPickerProps {
  now: string;
  choices: QuickId[];
  value?: string;
  onPick: (when: string) => void;
  onNotTodo?: () => void;
  onClear?: () => void;
}

export function WhenPicker({ now, choices, value, onPick, onNotTodo, onClear }: WhenPickerProps) {
  return (
    <>
      <div className="chips">
        {quickChoices(now, choices).map((q) => (
          <Chip key={q.id} variant="outlined" onClick={() => onPick(q.value)}>
            {q.label}
          </Chip>
        ))}
      </div>
      <DayPicker min={now} today={now} value={value} onPick={onPick} />
      {(onNotTodo || onClear) && (
        <SheetActions>
          {onNotTodo && (
            <Button variant="outlined" onClick={onNotTodo}>
              {copy.common.notATodo}
            </Button>
          )}
          {onClear && (
            <Button variant="ghost" onClick={onClear}>
              {copy.common.clear}
            </Button>
          )}
        </SheetActions>
      )}
    </>
  );
}
