import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { DayPicker } from "@/components/day-picker/day-picker.tsx";
import { PickField } from "@/components/field/pick-field.tsx";
import { longDate, todayIso } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export interface DateFieldProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  max?: string;
  yearSteps?: boolean;
  onClear?: () => void;
}

export function DateField({ label, value, onChange, max, yearSteps, onClear }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PickField
        label={label}
        icon={CalendarDotsIcon}
        value={value && longDate(value)}
        placeholder={copy.common.pickDay}
        onPick={() => setOpen(!open)}
        onClear={onClear}
      />
      {open && (
        <DayPicker
          today={todayIso()}
          value={value}
          {...(max && { max })}
          {...(yearSteps && { yearSteps })}
          onPick={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
