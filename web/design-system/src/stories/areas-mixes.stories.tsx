import type { Meta, StoryObj } from '@storybook/react-vite'
import { combos } from '../../tokens/mix-check.ts'
import { smallPartRule } from '../lib/area-mix.ts'
import { MixCell, label } from './area-parts.tsx'

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 16rem), 1fr))', gap: 'var(--space-md)' }

const meta = { title: 'Areas/Mixes', parameters: { controls: { disable: true }, layout: 'padded' } } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AllPairs: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
      <p style={label}>66 pairs. Gradients run in oklch. Text stays neutral. {smallPartRule}</p>
      <div style={grid}>
        {combos(2).map((areas) => (
          <MixCell key={areas.join('+')} areas={areas} />
        ))}
      </div>
    </div>
  ),
}

export const ThreeAreas: Story = {
  render: () => (
    <div style={grid}>
      {[
        ['health', 'fitness', 'rest-and-fun'],
        ['career', 'client-work', 'money'],
        ['love-life', 'relationships', 'home'],
        ['business-admin', 'life-admin', 'money'],
        ['personal-projects', 'career', 'rest-and-fun'],
        ['health', 'home', 'life-admin'],
      ].map((areas) => (
        <MixCell key={areas.join('+')} areas={areas} />
      ))}
    </div>
  ),
}
