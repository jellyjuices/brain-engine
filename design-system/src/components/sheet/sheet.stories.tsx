import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../button/button.tsx'
import { Sheet, type SheetProps } from './sheet.tsx'

const Live = (args: SheetProps) => {
  const [open, setOpen] = useState(args.open)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet {...args} open={open} onOpenChange={setOpen}>
        <p style={{ padding: '0 var(--space-sm)' }}>Drag the handle down, or swipe down fast, to close. Escape and the scrim close it too.</p>
        <div style={{ display: 'grid', gap: 'var(--space-sm)', padding: 'var(--space-sm)' }}>
          <Button block onClick={() => setOpen(false)}>Done</Button>
          <Button block variant="secondary" onClick={() => setOpen(false)}>Move</Button>
        </div>
      </Sheet>
    </>
  )
}

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  render: Live,
  parameters: { layout: 'fullscreen' },
  args: { open: true, onOpenChange: () => {}, title: 'Send the sample invoice', description: 'Northwind · Today', children: null },
  decorators: [(Story) => <div style={{ padding: 'var(--space-lg)', minHeight: '100dvh' }}><Story /></div>],
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const NoDescription: Story = { args: { description: undefined, title: 'Add' } }
