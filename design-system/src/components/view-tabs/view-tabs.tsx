import { Tabs } from 'radix-ui'
import type { ReactNode } from 'react'
import { usePill } from './use-pill.ts'
import './view-tabs.css'

export type View = { value: string; label: string; disabled?: boolean }

export type ViewTabsProps = {
  views: View[]
  value: string
  onValueChange: (value: string) => void
  label: string
  renderPanel?: (value: string) => ReactNode
}

export const ViewTabs = ({ views, value, onValueChange, label, renderPanel }: ViewTabsProps) => {
  const { list, box } = usePill(value)
  return (
    <Tabs.Root className="view-tabs" value={value} onValueChange={onValueChange} activationMode="manual">
      <Tabs.List ref={list} className="view-tabs-list" aria-label={label}>
        <span
          className="view-tabs-pill"
          aria-hidden
          style={{ transform: `translateX(${box.x}px)`, width: box.width, opacity: box.width ? 1 : 0 }}
        />
        {views.map((view) => (
          <Tabs.Trigger key={view.value} value={view.value} disabled={view.disabled} className="view-tabs-trigger">
            {view.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {renderPanel &&
        views.map((view) => (
          <Tabs.Content key={view.value} value={view.value} className="view-tabs-panel">
            {renderPanel(view.value)}
          </Tabs.Content>
        ))}
    </Tabs.Root>
  )
}
