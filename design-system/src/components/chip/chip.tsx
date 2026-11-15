import clsx from 'clsx'
import { XIcon } from '@phosphor-icons/react'
import { areaVar, splitAreas } from '../../lib/area-mix.ts'
import './chip.css'

export type ChipProps = {
  label: string
  variant?: 'tag' | 'check' | 'accent'
  onClick?: () => void
  onRemove?: () => void
  removeLabel?: string
  disabled?: boolean
  areas?: string[]
}

export const Chip = ({ label, variant = 'tag', onClick, onRemove, removeLabel, disabled, areas }: ChipProps) => {
  const Body = onClick ? 'button' : 'span'
  const dots = splitAreas(areas)
  return (
    <span className={clsx('chip', `chip--${variant}`, disabled && 'is-disabled')}>
      <Body
        className={onClick ? "chip-label hit-area" : "chip-label"}
        {...(onClick ? { type: 'button' as const, onClick, disabled } : {})}
      >
        {dots.shown.length > 0 && (
          <span className="chip-dots" aria-hidden>
            {dots.shown.map((a) => (
              <span key={a} className="chip-dot" style={{ background: areaVar(a, 'accent') }} />
            ))}
            {dots.extra > 0 && <span className="chip-dots-extra">+{dots.extra}</span>}
          </span>
        )}
        {label}
      </Body>
      {onRemove && (
        <button type="button" className="chip-remove hit-area" aria-label={removeLabel ?? `Remove ${label}`} onClick={onRemove} disabled={disabled}>
          <XIcon weight="bold" aria-hidden />
        </button>
      )}
    </span>
  )
}
