import { DayPicker, type Matcher } from "react-day-picker";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import styles from "./calendar.module.css";

export type CalendarProps = {
  today: string;
  value?: string;
  min?: string;
  max?: string;
  yearSteps?: boolean;
  autoFocus?: boolean;
  onPick: (iso: string) => void;
};

function at(iso: string): Date {
  const [y = 0, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function iso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function Chevron({ orientation }: { orientation?: string }) {
  return orientation === "left" ? (
    <CaretLeftIcon aria-hidden weight="bold" />
  ) : (
    <CaretRightIcon aria-hidden weight="bold" />
  );
}

export function Calendar({ today, value, min, max, yearSteps, autoFocus, onPick }: CalendarProps) {
  const selected = value ? at(value) : undefined;
  const disabled: Matcher[] = [
    ...(min ? [{ before: at(min) }] : []),
    ...(max ? [{ after: at(max) }] : []),
  ];
  return (
    <DayPicker
      className={styles.calendar}
      mode="single"
      required
      today={at(today)}
      selected={selected}
      onSelect={(date: Date) => onPick(iso(date))}
      disabled={disabled}
      defaultMonth={selected ?? at(today)}
      startMonth={min ? at(min) : yearSteps ? new Date(1900, 0) : undefined}
      endMonth={max ? at(max) : undefined}
      captionLayout={yearSteps ? "dropdown" : "label"}
      autoFocus={autoFocus}
      showOutsideDays
      weekStartsOn={0}
      components={{ Chevron }}
    />
  );
}
