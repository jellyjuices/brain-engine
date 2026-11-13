import { useState } from 'react'
import { ArrowsDownUpIcon, GearSixIcon, SlidersHorizontalIcon } from '@phosphor-icons/react'
import { Banner } from '../../components/banner/banner.tsx'
import { Button } from '../../components/button/button.tsx'
import { IconButton } from '../../components/icon-button/icon-button.tsx'
import { OptionsMenu } from '../../components/options-menu/options-menu.tsx'
import { PageHeader } from '../../components/page-header/page-header.tsx'
import { SectionHeader } from '../../components/section-header/section-header.tsx'
import { TabBar, type TabId } from '../../components/tab-bar/tab-bar.tsx'
import { Toast, ToastProvider, type ToastVariant } from '../../components/toast/toast.tsx'
import { TodoRow } from '../../components/todo-row/todo-row.tsx'
import { ViewTabs } from '../../components/view-tabs/view-tabs.tsx'
import { overdue, today, views, type SampleTodo } from './sample.ts'
import './todos-today.css'

export const TodosToday = () => {
  const [view, setView] = useState('today')
  const [tab, setTab] = useState<TabId>('todos')
  const [gone, setGone] = useState<string[]>([])
  const [last, setLast] = useState<SampleTodo | null>(null)
  const [toast, setToast] = useState(false)
  const [notice, setNotice] = useState<{ message: string; variant: ToastVariant }>({ message: 'Done', variant: 'success' })
  const [options, setOptions] = useState(false)
  const [sort, setSort] = useState('date')

  const remove = (todo: SampleTodo, message: string, variant: ToastVariant) => {
    setGone((ids) => [...ids, todo.id])
    setLast(todo)
    setNotice({ message, variant })
    setToast(false)
    requestAnimationFrame(() => setToast(true))
  }

  const tick = (todo: SampleTodo) => remove(todo, 'Done', 'success')

  const undo = () => last && setGone((ids) => ids.filter((id) => id !== last.id))

  const section = (title: string, items: SampleTodo[], late?: boolean) => {
    const open = items.filter((t) => !gone.includes(t.id))
    if (!open.length) return null
    return (
      <section>
        <SectionHeader title={title} count={open.length} tone={late ? 'late' : 'default'} />
        <ul className="todos-today-list">
          {open.map((t) => (
            <TodoRow
              key={t.id}
              {...t}
              checked={false}
              onCheckedChange={() => tick(t)}
              onSort={() => setOptions(true)}
              onDrop={() => remove(t, 'Deleted', 'neutral')}
            />
          ))}
        </ul>
      </section>
    )
  }

  return (
    <ToastProvider>
      <div className="todos-today">
        <PageHeader
          title="To-dos"
          kicker="Friday, Nov 13"
          action={
            <div className="todos-today-actions">
              <IconButton icon={SlidersHorizontalIcon} label="View options" onClick={() => setOptions(true)} />
              <IconButton icon={GearSixIcon} label="Settings" />
            </div>
          }
        >
          <ViewTabs views={views} value={view} onValueChange={setView} label="To-do views" />
        </PageHeader>
        <main className="todos-today-main">
          <div className="todos-today-banner">
            <Banner message="3 unsorted entries" actionLabel="Sort" />
          </div>
          {section('Overdue', overdue, true)}
          {section('Due today', today)}
          <div className="todos-today-more">
            <Button variant="ghost" size="sm">10 more have no date</Button>
          </div>
        </main>
        <div className="todos-today-tabs">
          <TabBar active={tab} onSelect={setTab} onAdd={() => {}} />
        </div>
      </div>
      <Toast
        open={toast}
        onOpenChange={setToast}
        message={notice.message}
        variant={notice.variant}
        detail={last?.title}
        actionLabel="Undo"
        onAction={undo}
      />
      <OptionsMenu
        open={options}
        onOpenChange={setOptions}
        title="Today"
        options={[
          {
            id: 'sort',
            label: 'Sort',
            icon: ArrowsDownUpIcon,
            options: [
              { id: 'date', label: 'By date', selected: sort === 'date', onSelect: () => setSort('date') },
              { id: 'name', label: 'By name', selected: sort === 'name', onSelect: () => setSort('name') },
            ],
          },
        ]}
      />
    </ToastProvider>
  )
}
