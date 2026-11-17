import { useState } from "react";
import { Popover } from "radix-ui";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import { Calendar } from "@/components/calendar/calendar.tsx";
import { longDate, todayIso } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";
import styles from "./date-field.module.css";

export type DateFieldProps = {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  yearSteps?: boolean;
};

export function DateField({
  label,
  value,
  onChange,
  placeholder = copy.common.pickDay,
  disabled,
  min,
  max,
  yearSteps,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const shown = value ? longDate(value) : placeholder;
  return (
    <div className={styles.dateField}>
      <span className={styles.label}>{label}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          className={styles.trigger}
          disabled={disabled}
          aria-label={`${label}: ${shown}`}
        >
          <CalendarBlankIcon aria-hidden className={styles.icon} />
          <span className={value ? undefined : styles.placeholder}>{shown}</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className={styles.popover} sideOffset={6} align="start">
            <Calendar
              today={todayIso()}
              value={value}
              min={min}
              max={max}
              yearSteps={yearSteps}
              autoFocus
              onPick={(iso) => {
                onChange(iso);
                setOpen(false);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
