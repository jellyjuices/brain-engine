import type { Meta, StoryObj } from '@storybook/react-vite'
import { PlusButton } from './plus-button.tsx'

const meta = {
  title: 'Components/Plus button',
  component: PlusButton,
  args: { label: 'Add', size: 'md', disabled: false, raised: false },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'lg'] } },
} satisfies Meta<typeof PlusButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Large: Story = { args: { size: 'lg' } }
export const Disabled: Story = { args: { disabled: true } }
