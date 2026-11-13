import clsx from 'clsx'
import { CheckSquareIcon, FoldersIcon, MagnifyingGlassIcon, MountainsIcon, type Icon } from '@phosphor-icons/react'
import { PlusButton } from '../plus-button/plus-button.tsx'
import './tab-bar.css'

export type TabId = 'todos' | 'goals' | 'find' | 'brain'

type Tab = { id: TabId; label: string; icon: Icon; activeWeight?: 'fill' | 'bold' }

const left: Tab[] = [
  { id: 'todos', label: 'To-dos', icon: CheckSquareIcon },
  { id: 'goals', label: 'Goals', icon: MountainsIcon },
]
const right: Tab[] = [
  { id: 'find', label: 'Find', icon: MagnifyingGlassIcon, activeWeight: 'bold' },
  { id: 'brain', label: 'Brain', icon: FoldersIcon },
]

export type TabBarProps = {
  active: TabId
  onSelect: (id: TabId) => void
  onAdd: () => void
  addLabel?: string
}

export const TabBar = ({ active, onSelect, onAdd, addLabel = 'Add' }: TabBarProps) => {
  const item = ({ id, label, icon: Glyph, activeWeight = 'fill' }: Tab) => (
    <button
      key={id}
      type="button"
      className={clsx('tab-bar-item', id === active && 'is-active')}
      aria-current={id === active ? 'page' : undefined}
      onClick={() => onSelect(id)}
    >
      <Glyph weight={id === active ? activeWeight : 'regular'} aria-hidden className="tab-bar-icon" />
      {label}
    </button>
  )
  return (
    <nav className="tab-bar" aria-label="Main">
      {left.map(item)}
      <PlusButton label={addLabel} onClick={onAdd} raised />
      {right.map(item)}
    </nav>
  )
}
