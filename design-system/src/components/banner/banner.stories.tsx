import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Banner } from './banner.tsx'

const meta = {
  title: 'Components/Banner',
  component: Banner,
  args: { message: '3 unsorted entries', actionLabel: 'Sort', onAction: fn() },
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

export const Unsorted: Story = {}
export const NoAction: Story = { args: { actionLabel: undefined } }
