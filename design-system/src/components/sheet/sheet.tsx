import clsx from 'clsx'
import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { IconButton } from '../icon-button/icon-button.tsx'
import { useDragClose } from './use-drag-close.ts'
import './sheet.css'
import './sheet-panel.css'

export type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  hideTitle?: boolean
  description?: string
  header?: ReactNode
  closeLabel?: string
  children: ReactNode
}

export const Sheet = ({ open, onOpenChange, title, hideTitle, description, header, closeLabel, children }: SheetProps) => {
  const drag = useDragClose(() => onOpenChange(false))
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) drag.reset()
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-scrim" />
        <Dialog.Content
          className={clsx('sheet', drag.dragging && 'is-dragging')}
          style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
          onAnimationEnd={drag.reset}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="sheet-grip" {...drag.handlers}>
            <span className="sheet-handle" aria-hidden />
          </div>
          <div className="sheet-head" {...drag.handlers}>
            {header ?? <Dialog.Title className={clsx('sheet-title', hideTitle && 'visually-hidden')}>{title}</Dialog.Title>}
            {header && <Dialog.Title className="visually-hidden">{title}</Dialog.Title>}
            {closeLabel && (
              <Dialog.Close asChild>
                <IconButton icon={XIcon} label={closeLabel} className="sheet-close" />
              </Dialog.Close>
            )}
          </div>
          {description && <Dialog.Description className="sheet-description">{description}</Dialog.Description>}
          <div className="sheet-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
