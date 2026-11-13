import { useState } from 'react'
import { Popover } from 'radix-ui'
import { CalendarBlankIcon } from '@phosphor-icons/react'
import type { Matcher } from 'react-day-picker'
import { Calendar } from '../calendar/calendar.tsx'
import './date-field.css'

const format = new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })

export type DateFieldProps = {
  label: string
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  disabledDays?: Matcher | Matcher[]
}

export const DateField = ({ label, value, onChange, placeholder = 'Pick a day', disabled, disabledDays }: DateFieldProps) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="date-field">
      <span className="date-field-label">{label}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger className="date-field-trigger" disabled={disabled} aria-label={`${label}: ${value ? format.format(value) : placeholder}`}>
          <CalendarBlankIcon aria-hidden className="date-field-icon" />
          <span className={value ? undefined : 'date-field-placeholder'}>{value ? format.format(value) : placeholder}</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="date-field-popover" sideOffset={6} align="start">
            <Calendar
              selected={value}
              disabled={disabledDays}
              autoFocus
              onSelect={(date) => {
                onChange(date)
                setOpen(false)
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
