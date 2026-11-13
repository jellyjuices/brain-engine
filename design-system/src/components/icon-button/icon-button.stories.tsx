import type { Meta, StoryObj } from '@storybook/react-vite'
import { DotsThreeIcon, GearSixIcon, PencilSimpleIcon, PlusIcon } from '@phosphor-icons/react'
import { fn } from 'storybook/test'
import { IconButton } from './icon-button.tsx'

const meta = {
  title: 'Components/Icon button',
  component: IconButton,
  args: { icon: GearSixIcon, label: 'Settings', variant: 'ghost', size: 'md', disabled: false, onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    icon: { control: false },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
      <IconButton {...args} variant="primary" icon={PlusIcon} label="Add" />
      <IconButton {...args} variant="secondary" icon={PencilSimpleIcon} label="Edit" />
      <IconButton {...args} variant="ghost" icon={DotsThreeIcon} label="More" />
      <IconButton {...args} variant="primary" icon={PlusIcon} label="Add" disabled />
      <IconButton {...args} variant="secondary" icon={PencilSimpleIcon} label="Edit" disabled />
    </div>
  ),
}
