import type { Meta, StoryObj } from '@storybook/react-vite'
import { TodosToday } from '../screens/todos-today/todos-today.tsx'

const meta = {
  title: 'Screens/To-dos Today',
  component: TodosToday,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TodosToday>

export default meta
type Story = StoryObj<typeof meta>

export const Today: Story = {}
