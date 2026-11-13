import { DayPicker, type Matcher } from 'react-day-picker'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import './calendar.css'

export type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: Matcher | Matcher[]
  defaultMonth?: Date
  autoFocus?: boolean
}

export const Calendar = ({ selected, onSelect, disabled, defaultMonth, autoFocus }: CalendarProps) => (
  <DayPicker
    className="calendar"
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
