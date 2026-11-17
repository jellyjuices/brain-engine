import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { TabBar, type TabBarProps } from './tab-bar.tsx'

const Live = (args: TabBarProps) => {
  const [active, setActive] = useState(args.active)
  return (
    <div style={{ maxWidth: 'var(--size-max-width)', paddingTop: 'var(--space-xl)' }}>
      <TabBar {...args} active={active} onSelect={setActive} />
    </div>
  )
}

const meta = {
  title: 'Components/Tab bar',
  component: TabBar,
  render: Live,
  args: { active: 'todos', onSelect: fn(), onAdd: fn() },
  argTypes: { active: { control: 'inline-radio', options: ['todos', 'goals', 'find', 'brain'] } },
} satisfies Meta<typeof TabBar>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
