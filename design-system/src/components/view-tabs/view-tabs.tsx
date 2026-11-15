import { css } from '@linaria/core'
import { Tabs } from 'radix-ui'
import type { ReactNode } from 'react'
import { usePill } from './use-pill.ts'

const list = css`
  position: relative;
  display: flex;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-md) var(--space-sm);
  overflow-x: auto;
  scrollbar-width: none;
`

const pill = css`
  position: absolute;
  top: var(--space-xs);
  bottom: var(--space-sm);
  left: 0;
  border-radius: var(--radius-control);
  background: var(--background-accent-soft);
  pointer-events: none;
  transition:
    transform var(--motion-slow) var(--motion-easing),
    width var(--motion-slow) var(--motion-easing);
`

const trigger = css`
  position: relative;
  flex: none;
  min-height: var(--size-target);
  padding: 0 var(--space-md);
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--motion-fast) var(--motion-easing),
    background-color var(--motion-fast) var(--motion-easing),
    box-shadow var(--motion-fast) var(--motion-easing);

  &:active:not(:disabled) {
    background: var(--background-pressed);
  }

  &[data-state='active'] {
    color: var(--text-accent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 var(--size-focus) var(--border-focus);
  }

  &:disabled {
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  @media (hover: hover) {
    &:hover:not([data-state='active']):not(:disabled) {
      background: var(--background-hover);
      color: var(--text-primary);
    }
  }
`

const panel = css`
  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 var(--size-focus) var(--border-focus);
    border-radius: var(--radius-card);
  }
`

export type View = { value: string; label: string; disabled?: boolean }

export type ViewTabsProps = {
  views: View[]
  value: string
  onValueChange: (value: string) => void
  label: string
  renderPanel?: (value: string) => ReactNode
}

export const ViewTabs = ({ views, value, onValueChange, label, renderPanel }: ViewTabsProps) => {
  const { list: listRef, box } = usePill(value)
  return (
    <Tabs.Root value={value} onValueChange={onValueChange} activationMode="manual">
      <Tabs.List ref={listRef} className={list} aria-label={label}>
        <span
          className={pill}
          aria-hidden
          style={{ transform: `translateX(${box.x}px)`, width: box.width, opacity: box.width ? 1 : 0 }}
        />
        {views.map((view) => (
          <Tabs.Trigger key={view.value} value={view.value} disabled={view.disabled} className={trigger}>
            {view.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {renderPanel &&
        views.map((view) => (
          <Tabs.Content key={view.value} value={view.value} className={panel}>
            {renderPanel(view.value)}
          </Tabs.Content>
        ))}
    </Tabs.Root>
  )
}
