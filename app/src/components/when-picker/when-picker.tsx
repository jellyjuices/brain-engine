import { Button } from "@/components/button/button.tsx";
import { Calendar } from "@/components/calendar/calendar.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { Chips } from "@/components/chip/chips.tsx";
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
      <Chips>
        {quickChoices(now, choices).map((q) => (
          <Chip key={q.id} label={q.label} onClick={() => onPick(q.value)} />
        ))}
      </Chips>
      <Calendar min={now} today={now} value={value} onPick={onPick} />
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
