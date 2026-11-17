import { css } from '@linaria/core'
import type { Icon } from '@phosphor-icons/react'
import { CalendarBlankIcon, CalendarXIcon, CircleDashedIcon, HourglassMediumIcon } from '@phosphor-icons/react'
import type { WhenStatus } from '../../lib/when.ts'
import { visuallyHidden } from '../visually-hidden/visually-hidden.ts'

const whenChip = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-body-xs);
  line-height: var(--font-leading-snug);
  color: var(--text-secondary);
  white-space: nowrap;
`

const glyph = css`
  flex: none;
  width: var(--font-size-body-sm);
  height: var(--font-size-body-sm);
`

const statuses: Record<WhenStatus, string> = {
  overdue: css`
    color: var(--text-primary);
    font-weight: var(--font-weight-semibold);

    & .${glyph} {
      color: var(--status-late);
    }
  `,
  waiting: css`
    & .${glyph} {
      color: var(--status-waiting);
    }
  `,
  today: css`
    color: var(--text-primary);
  `,
  due: '',
  someday: '',
}

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
    <span className={`${whenChip} ${statuses[status]}`}>
      <Glyph aria-hidden weight={status === 'overdue' ? 'bold' : 'regular'} className={glyph} />
      {statusLabel && <span className={visuallyHidden}>{statusLabel} </span>}
      {label}
    </span>
  )
}
