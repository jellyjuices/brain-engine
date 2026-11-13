import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ramps, Semantic, Shapes, Spacing, TypeScale } from './token-parts.tsx'

const meta = { title: 'Tokens', parameters: { controls: { disable: true } } } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => (
    <>
      <Ramps />
      <TypeScale />
      <Spacing />
      <Shapes />
      <Semantic />
    </>
  ),
}
export const ColourRamps: Story = { render: () => <Ramps /> }
export const TypeScaleStory: Story = { name: 'Type scale', render: () => <TypeScale /> }
export const SpacingStory: Story = { name: 'Spacing', render: () => <Spacing /> }
export const RadiusAndShapes: Story = { render: () => <Shapes /> }
export const SemanticTable: Story = { render: () => <Semantic /> }
