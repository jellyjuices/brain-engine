export type SampleTodo = { id: string; title: string; tag: string; date?: string; late?: boolean; check?: boolean }

export const overdue: SampleTodo[] = [
  { id: 'o1', title: 'Book the sample dentist visit', tag: 'Health', date: 'Tue, Nov 10', late: true },
  { id: 'o2', title: 'Reply to the sample landlord', tag: 'Home', date: 'Wed, Nov 11', late: true },
]

export const today: SampleTodo[] = [
  { id: 't1', title: 'Send the sample invoice', tag: 'Northwind', date: 'Today' },
  { id: 't2', title: 'Pick up the sample parcel', tag: 'Errands', date: 'Today', check: true },
  { id: 't3', title: 'Draft the sample brief', tag: 'Northwind', date: 'Today' },
]

export const views = [
  { value: 'today', label: 'Today' },
  { value: 'soon', label: 'Soon' },
  { value: 'no-date', label: 'No date' },
  { value: 'northwind', label: 'Northwind' },
  { value: 'all', label: 'All views' },
]
