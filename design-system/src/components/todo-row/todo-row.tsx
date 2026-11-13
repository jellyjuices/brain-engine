import clsx from 'clsx'
import { useId, useRef } from 'react'
import { Checkbox } from 'radix-ui'
import { CheckIcon, FunnelSimpleIcon, TrashIcon } from '@phosphor-icons/react'
import { Chip } from '../chip/chip.tsx'
import { useSwipe } from './use-swipe.ts'
import './todo-row.css'

export type TodoRowProps = {
  title: string
  tag?: string
  date?: string
  late?: boolean
  check?: boolean
  checked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  onSort?: () => void
  onDrop?: () => void
  sortLabel?: string
  dropLabel?: string
}

export const TodoRow = ({
  title,
  tag,
  date,
  late,
  check,
  checked,
  disabled,
  onCheckedChange,
  onSort,
  onDrop,
  sortLabel = 'Sort',
  dropLabel = 'Delete',
}: TodoRowProps) => {
  const id = useId()
  const actions = [onSort && 'sort', onDrop && 'drop'].filter(Boolean).length
  const tray = useRef<HTMLDivElement>(null)
  const swipe = useSwipe(() => tray.current?.offsetWidth ?? 0, disabled || actions === 0)
  const run = (fn?: () => void) => () => {
    swipe.close()
    fn?.()
  }

  return (
    <li
      className={clsx('todo-row', checked && 'is-done', disabled && 'is-disabled', swipe.dragging && 'is-dragging')}
      onKeyDown={(e) => e.key === 'Escape' && swipe.close()}
    >
      {actions > 0 && !disabled && (
        <div ref={tray} className="todo-row-actions">
          {onSort && (
            <button type="button" className="todo-row-action todo-row-action--sort" onFocus={swipe.open} onClick={run(onSort)}>
              <FunnelSimpleIcon aria-hidden />
              {sortLabel}
            </button>
          )}
          {onDrop && (
            <button type="button" className="todo-row-action todo-row-action--drop" onFocus={swipe.open} onClick={run(onDrop)}>
              <TrashIcon aria-hidden />
              {dropLabel}
            </button>
          )}
        </div>
      )}
      <div className="todo-row-content" style={{ transform: `translateX(${swipe.offset}px)` }} {...swipe.handlers}>
        <Checkbox.Root
          id={id}
          className="todo-row-tick hit-area"
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange?.(value === true)}
        >
          <Checkbox.Indicator className="todo-row-mark">
            <CheckIcon weight="bold" aria-hidden />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <div className="todo-row-body">
          <label htmlFor={id} className="todo-row-title">
            {title}
          </label>
          {(tag || date || check) && (
            <div className="todo-row-meta">
              {tag && <Chip label={tag} disabled={disabled} />}
              {check && <Chip label="check" variant="check" disabled={disabled} />}
              {date && <span className={clsx('todo-row-date', late && 'is-late')}>{date}</span>}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
