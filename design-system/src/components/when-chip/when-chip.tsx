import clsx from 'clsx'
import type { Icon } from '@phosphor-icons/react'
import { CalendarBlankIcon, CalendarXIcon, CircleDashedIcon, HourglassMediumIcon } from '@phosphor-icons/react'
import type { WhenStatus } from '../../lib/when.ts'
import './when-chip.css'

export type WhenChipProps = {
  label: string
  status: WhenStatus
  statusLabel?: string
}

const glyphs: Record<WhenStatus, Icon> = {
  overdue: CalendarXIcon,
  waiting: HourglassMediumIcon,
  today: CalendarBlankIcon,
  due: CalendarBlankIcon,
  someday: CircleDashedIcon,
}

export const WhenChip = ({ label, status, statusLabel }: WhenChipProps) => {
  const Glyph = glyphs[status]
  return (
    <span className={clsx('when-chip', `when-chip--${status}`)}>
      <Glyph aria-hidden weight={status === 'overdue' ? 'bold' : 'regular'} className="when-chip-glyph" />
      {statusLabel && <span className="visually-hidden">{statusLabel} </span>}
      {label}
    </span>
  )
}
