import type { WhenChipProps } from '../../components/when-chip/when-chip.tsx'

export type SampleTodo = { id: string; title: string; tag: string; when?: WhenChipProps; check?: boolean }

export const overdue: SampleTodo[] = [
  { id: 'o1', title: 'Book the sample dentist visit', tag: 'Health', when: { label: 'Tue, Nov 10', status: 'overdue' } },
  { id: 'o2', title: 'Reply to the sample landlord', tag: 'Home', when: { label: 'Wed, Nov 11', status: 'overdue' } },
]

export const today: SampleTodo[] = [
  { id: 't1', title: 'Send the sample invoice', tag: 'Northwind', when: { label: 'Today', status: 'today' } },
  { id: 't2', title: 'Pick up the sample parcel', tag: 'Errands', when: { label: 'Today', status: 'today' }, check: true },
  { id: 't3', title: 'Draft the sample brief', tag: 'Northwind', when: { label: 'Today', status: 'today' } },
]

export const views = [
  { value: 'today', label: 'Today' },
  { value: 'soon', label: 'Soon' },
  { value: 'no-date', label: 'No date' },
  { value: 'northwind', label: 'Northwind' },
  { value: 'all', label: 'All views' },
]
