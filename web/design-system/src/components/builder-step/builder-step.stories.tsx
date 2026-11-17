import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { Button } from '../button/button.tsx'
import { SuggestInput } from '../suggest-input/suggest-input.tsx'
import { BuilderStep } from './builder-step.tsx'
import { useBuilder } from './use-builder.ts'

const subjects = [
  { id: 'northwind', label: 'Northwind', hint: 'subject' },
  { id: 'home', label: 'Home', hint: 'subject' },
  { id: 'run', label: 'Run a sample 10K', hint: 'goal' },
]
const whens = ['Today', 'Tomorrow', 'Weekend', 'Next week', 'Someday']

const WhenChoices = ({ value, onPick }: { value?: string; onPick: (v: string) => void }) => (
  <div role="group" aria-label="When?" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
    {whens.map((w) => (
      <Button key={w} variant={value === w ? 'primary' : 'secondary'} aria-pressed={value === w} onClick={() => onPick(w)}>
        {w}
      </Button>
    ))}
  </div>
)

const Flow = ({ resumeAt = 0 }: { resumeAt?: number }) => {
  const builder = useBuilder(2, resumeAt, fn())
  const [when, setWhen] = useState<string>()
  const words = {
    title: 'Add a to-do',
    count: builder.count,
    step: builder.step,
    stepLabel: `${builder.step + 1} / ${builder.count}`,
    backLabel: 'Back',
    skipLabel: 'Skip',
    closeLabel: 'Close',
    onClose: fn(),
    onBack: builder.first ? undefined : builder.back,
    onSkip: builder.skip,
  }
  return builder.step === 0 ? (
    <BuilderStep {...words} question="About what?" hint="A subject or a goal." nextLabel="Next" onNext={builder.next}>
      <SuggestInput label="About what?" hideLabel suggestions={subjects} />
    </BuilderStep>
  ) : (
    <BuilderStep {...words} question="When?" nextLabel="Add" onNext={fn()} nextDisabled={!when}>
      <WhenChoices value={when} onPick={setWhen} />
    </BuilderStep>
  )
}

const meta = {
  title: 'Components/Builder step',
  component: BuilderStep,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Add a to-do',
    step: 0,
    count: 2,
    stepLabel: '1 / 2',
    question: 'About what?',
    hint: 'A subject or a goal.',
    backLabel: 'Back',
    nextLabel: 'Next',
    skipLabel: 'Skip',
    closeLabel: 'Close',
    onNext: fn(),
    onSkip: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof BuilderStep>

export default meta
type Story = StoryObj<typeof meta>

export const AboutWhat: Story = { render: () => <Flow /> }
export const When: Story = { render: () => <Flow resumeAt={1} /> }
export const Resumed: Story = {
  args: { step: 1, stepLabel: '2 / 2', question: 'When?', hint: undefined, nextLabel: 'Add', onBack: fn() },
  render: (args) => (
    <BuilderStep {...args}>
      <WhenChoices value="Tomorrow" onPick={() => {}} />
    </BuilderStep>
  ),
}
export const NextDisabled: Story = { args: { step: 1, stepLabel: '2 / 2', question: 'When?', nextLabel: 'Add', nextDisabled: true, onBack: fn() } }
export const NoSkip: Story = { args: { onSkip: undefined } }
