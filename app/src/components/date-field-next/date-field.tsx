import { css } from "@linaria/core";
import { useState } from "react";
import { Popover } from "radix-ui";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import type { Matcher } from "react-day-picker";
import { Calendar } from "../calendar/calendar.tsx";

const dateField = css`
  display: grid;
  gap: var(--space-xs);
`;

const label = css`
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
`;

const trigger = css`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  height: var(--size-control);
  padding: 0 var(--space-md);
  border: var(--size-hair) solid var(--border-strong);
  border-radius: var(--radius-input);
  background: var(--background-secondary);
  text-align: left;
  cursor: pointer;

  &[data-state="open"] {
    border-color: var(--border-focus);
  }

  &:disabled {
    border-style: dashed;
    border-color: var(--border-primary);
    background: var(--background-disabled);
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  @media (hover: hover) {
    &:hover:not(:disabled) {
      background:
        linear-gradient(var(--background-hover), var(--background-hover)),
        var(--background-secondary);
    }
  }
`;

const icon = css`
  width: var(--size-icon-sm);
  height: var(--size-icon-sm);
  color: var(--text-secondary);
`;

const placeholderText = css`
  color: var(--text-secondary);
`;

const popover = css`
  z-index: 20;
  padding: var(--space-sm);
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-card);
  background: var(--background-raised);
  color: var(--text-primary);
  box-shadow: var(--shadow-raised);
  animation: date-field-in var(--motion-fast) var(--motion-easing);

  @keyframes date-field-in {
    from {
      opacity: 0;
      transform: translateY(calc(var(--space-xs) * -1));
    }
  }
`;

const format = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export type DateFieldProps = {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledDays?: Matcher | Matcher[];
};

export const DateField = ({
  label: text,
  value,
  onChange,
  placeholder = "Pick a day",
  disabled,
  disabledDays,
}: DateFieldProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={dateField}>
      <span className={label}>{text}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          className={trigger}
          disabled={disabled}
          aria-label={`${text}: ${value ? format.format(value) : placeholder}`}
        >
          <CalendarBlankIcon aria-hidden className={icon} />
          <span className={value ? undefined : placeholderText}>
            {value ? format.format(value) : placeholder}
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className={popover} sideOffset={6} align="start">
            <Calendar
              selected={value}
              disabled={disabledDays}
              autoFocus
              onSelect={(date) => {
                onChange(date);
                setOpen(false);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
