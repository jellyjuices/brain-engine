import { css } from '@linaria/core'
import { DayPicker, type Matcher } from 'react-day-picker'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'

const calendar = css`
  position: relative;
  width: max-content;
  font-size: var(--font-size-body-sm);

  & .rdp-month_caption {
    display: flex;
    align-items: center;
    height: var(--size-control);
    padding: 0 var(--space-sm);
  }

  & .rdp-caption_label {
    font-family: var(--font-display);
    font-size: var(--font-size-display-sm);
  }

  & .rdp-nav {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    gap: var(--space-2xs);
  }

  & .rdp-button_previous,
  & .rdp-button_next {
    display: grid;
    place-items: center;
    width: var(--size-control);
    height: var(--size-control);
    padding: 0;
    border: 0;
    border-radius: var(--radius-control);
    background: none;
    color: var(--text-primary);
    cursor: pointer;
  }

  & .rdp-button_previous:disabled,
  & .rdp-button_next:disabled {
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  & .rdp-chevron,
  & .rdp-nav svg {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
  }

  & .rdp-month_grid {
    border-collapse: collapse;
  }

  & .rdp-weekday {
    height: var(--size-day);
    font-size: var(--font-size-body-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
  }

  & .rdp-day {
    padding: var(--space-2xs);
    text-align: center;
  }

  & .rdp-day_button {
    display: grid;
    place-items: center;
    width: var(--size-day);
    height: var(--size-day);
    padding: 0;
    border: 0;
    border-radius: var(--radius-control);
    background: none;
    font-family: var(--font-number);
    font-size: var(--font-size-number-sm);
    cursor: pointer;
    transition: background-color var(--motion-fast) var(--motion-easing);
  }

  & .rdp-day_button:active:not(:disabled) {
    background: var(--background-pressed);
  }

  & .rdp-today:not(.rdp-selected) .rdp-day_button {
    color: var(--text-accent);
    font-weight: var(--font-weight-bold);
    box-shadow: inset 0 0 0 var(--size-hair) var(--border-selected);
  }

  & .rdp-outside .rdp-day_button {
    color: var(--text-secondary);
  }

  & .rdp-disabled .rdp-day_button {
    color: var(--text-disabled);
    text-decoration: line-through;
    cursor: not-allowed;
  }

  & .rdp-hidden {
    visibility: hidden;
  }

  @media (hover: hover) {
    & .rdp-button_previous:hover:not(:disabled),
    & .rdp-button_next:hover:not(:disabled) {
      background: var(--background-hover);
    }

    & .rdp-day_button:hover:not(:disabled) {
      background: var(--background-hover);
    }

    & .rdp-selected .rdp-day_button,
    & .rdp-selected .rdp-day_button:hover {
      background: var(--background-accent);
      color: var(--text-on-accent);
      font-weight: var(--font-weight-bold);
    }
  }
`

export type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: Matcher | Matcher[]
  defaultMonth?: Date
  autoFocus?: boolean
}

export const Calendar = ({ selected, onSelect, disabled, defaultMonth, autoFocus }: CalendarProps) => (
  <DayPicker
    className={calendar}
    mode="single"
    selected={selected}
    onSelect={onSelect}
    disabled={disabled}
    defaultMonth={defaultMonth ?? selected}
    autoFocus={autoFocus}
    showOutsideDays
    weekStartsOn={0}
    components={{
      Chevron: ({ orientation }) =>
        orientation === 'left' ? <CaretLeftIcon aria-hidden weight="bold" /> : <CaretRightIcon aria-hidden weight="bold" />,
    }}
  />
)
