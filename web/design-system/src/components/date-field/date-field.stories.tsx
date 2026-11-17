import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DateField, type DateFieldProps } from './date-field.tsx'

const Live = (args: DateFieldProps) => {
  const [date, setDate] = useState<Date | undefined>(args.value)
  return (
    <div style={{ maxWidth: 'var(--size-max-width)', minHeight: 'calc(var(--size-control) * 9)' }}>
      <DateField {...args} value={date} onChange={setDate} />
    </div>
  )
}

const meta = {
  title: 'Components/Date field',
  component: DateField,
  render: Live,
  args: { label: 'When?', placeholder: 'Pick a day', disabled: false, onChange: () => {} },
} satisfies Meta<typeof DateField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Picked: Story = { args: { value: new Date(2026, 10, 20) } }
export const Disabled: Story = { args: { disabled: true } }
