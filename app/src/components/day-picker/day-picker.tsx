import "./day-picker.css";
import {
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import { addDays, isoDate } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" });

function at(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function daysOf(year: number, month: number): string[] {
  const days: string[] = [];
  for (
    let iso = isoDate(new Date(year, month, 1, 12));
    at(iso).getMonth() === month;
    iso = addDays(iso, 1)
  )
    days.push(iso);
  return days;
}

export interface DayPickerProps {
  min?: string;
  max?: string;
  yearSteps?: boolean;
  today: string;
  value?: string;
  onPick: (iso: string) => void;
}

export function DayPicker({ min, max, yearSteps, today, value, onPick }: DayPickerProps) {
  const [picked, setPicked] = useState(value ?? "");
  const [shown, setShown] = useState(() => {
    const start = at(value || today);
    return { year: start.getFullYear(), month: start.getMonth() };
  });
  const first = new Date(shown.year, shown.month, 1, 12);

  function shift(n: number) {
    const d = new Date(shown.year, shown.month + n, 1, 12);
    setShown({ year: d.getFullYear(), month: d.getMonth() });
  }

  const month = isoDate(first).slice(0, 7);

  function stop(n: number) {
    return (
      (min !== undefined &&
        isoDate(new Date(shown.year, shown.month + n, 1, 12)).slice(0, 7) < min.slice(0, 7)) ||
      (max !== undefined &&
        isoDate(new Date(shown.year, shown.month + n, 1, 12)).slice(0, 7) > max.slice(0, 7))
    );
  }

  return (
    <div className="dp">
      <div className="dp-head">
        {yearSteps && (
          <button
            className="dp-nav dp-year"
            type="button"
            aria-label={copy.common.lastYear}
            disabled={stop(-12)}
            onClick={() => shift(-12)}
          >
            <Icon icon={CaretDoubleLeftIcon} />
          </button>
        )}
        <button
          className="dp-nav"
          type="button"
          aria-label={copy.common.lastMonth}
          disabled={min !== undefined && month <= min.slice(0, 7)}
          onClick={() => shift(-1)}
        >
          <Icon icon={CaretLeftIcon} />
        </button>
        <span className="dp-title" aria-live="polite">
          {MONTH.format(first)}
        </span>
        <button
          className="dp-nav"
          type="button"
          aria-label={copy.common.nextMonth}
          disabled={max !== undefined && month >= max.slice(0, 7)}
          onClick={() => shift(1)}
        >
          <Icon icon={CaretRightIcon} />
        </button>
        {yearSteps && (
          <button
            className="dp-nav dp-year"
            type="button"
            aria-label={copy.common.nextYear}
            disabled={stop(12)}
            onClick={() => shift(12)}
          >
            <Icon icon={CaretDoubleRightIcon} />
          </button>
        )}
      </div>
      <div className="dp-week" aria-hidden="true">
        {WEEK.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="dp-grid" role="grid">
        {Array.from({ length: first.getDay() }, (_, i) => (
          <span key={`pad-${i}`} className="dp-pad" />
        ))}
        {daysOf(shown.year, shown.month).map((day) => (
          <button
            key={day}
            className={clsx("dp-day", day === today && "is-today", day === picked && "is-picked")}
            type="button"
            disabled={(min !== undefined && day < min) || (max !== undefined && day > max)}
            aria-pressed={day === picked}
            aria-label={at(day).toDateString()}
            onClick={() => {
              setPicked(day);
              onPick(day);
            }}
          >
            {at(day).getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}
