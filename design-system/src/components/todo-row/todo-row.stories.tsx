import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { TodoRow, type TodoRowProps } from './todo-row.tsx'

const Live = (args: TodoRowProps) => {
  const [checked, setChecked] = useState(args.checked ?? false)
  return (
    <ul style={{ margin: 0, padding: 0, maxWidth: 'var(--size-max-width)' }}>
      <TodoRow {...args} checked={checked} onCheckedChange={setChecked} />
    </ul>
  )
}

const meta = {
  title: 'Components/To-do row',
  component: TodoRow,
  render: Live,
  args: { title: 'Send the sample invoice', tag: 'Northwind', date: 'Today', late: false, check: false, checked: false, disabled: false, onSort: fn(), onDrop: fn() },
} satisfies Meta<typeof TodoRow>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Late: Story = { args: { title: 'Book the sample appointment', tag: 'Home', date: 'Tue, Nov 10', late: true } }
export const NeedsCheck: Story = { args: { title: 'Call about the sample quote', tag: 'Health', check: true, date: undefined } }
export const Done: Story = { args: { checked: true } }
export const Disabled: Story = { args: { disabled: true } }
