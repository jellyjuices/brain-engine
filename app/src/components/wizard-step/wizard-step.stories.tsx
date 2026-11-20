import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { CheckIcon } from "@phosphor-icons/react";
import { Chip } from "../chip/chip.tsx";
import { DateField } from "../date-field/date-field.tsx";
import { TextField } from "../field/text-field.tsx";
import { List } from "../list/list.tsx";
import { ListRow } from "../list/list-row.tsx";
import { SectionHeader } from "../section-header/section-header.tsx";
import { WizardStep } from "./wizard-step.tsx";
import { copy } from "@/content/index.ts";

const COUNT = 3;
const NAME = "Louis";
const subjects = [
  { id: "gym", title: "Gym", type: "Place" },
  { id: "work", title: "Northwind", type: "Subject" },
];
const lines = [
  { id: "call", title: "Call Louis about the move", sub: "To-do · Moving" },
  { id: "dinner", title: "Dinner with Louis on Friday", sub: "Journal · 2026-11-13" },
];

function toggle(set: Set<string>, id: string) {
  const next = new Set(set);
  if (!next.delete(id)) next.add(id);
  return next;
}

function Builder({ start = 0 }: { start?: number }) {
  const [step, setStep] = useState(start);
  const [name, setName] = useState(start === 0 ? "" : NAME);
  const [day, setDay] = useState("");
  const [known, setKnown] = useState(new Set<string>());
  const [linked, setLinked] = useState(new Set<string>());
  const shared = {
    title: copy.sort.person,
    step,
    count: COUNT,
    stepLabel: copy.sort.stepOf(step + 1, COUNT),
    backLabel: copy.common.back,
    onClose: fn(),
    onNext: () => setStep(step + 1),
  };
  const skip = { skipLabel: copy.sort.skip, onSkip: () => setStep(step + 1) };

  if (step === 0)
    return (
      <WizardStep
        {...shared}
        question={copy.sort.nameQuestion.person}
        hint={copy.sort.nameHint}
        nextLabel={copy.add.addPerson}
        nextDisabled={!name.trim()}
      >
        <TextField
          label={copy.add.name}
          placeholder={copy.add.personPlaceholder}
          value={name}
          onChange={setName}
        />
        <DateField label={copy.add.birthdayOptional} value={day || undefined} onChange={setDay} />
      </WizardStep>
    );
  if (step === 1)
    return (
      <WizardStep
        {...shared}
        {...skip}
        question={copy.sort.howKnow(NAME)}
        hint={copy.sort.pickAny}
        nextLabel={copy.sort.addKnown(NAME, [...known])}
        nextDisabled={known.size === 0}
      >
        <SectionHeader title={copy.sort.allSubjects} as="h3" />
        <List variant="ghost">
          {subjects.map((s) => (
            <ListRow
              key={s.id}
              title={s.title}
              sub={s.type}
              end={known.has(s.id) && <CheckIcon aria-label={copy.sort.picked(s.title)} />}
              onClick={() => setKnown(toggle(known, s.id))}
            />
          ))}
        </List>
      </WizardStep>
    );
  return (
    <WizardStep
      {...shared}
      {...skip}
      question={copy.sort.addNotesTo(NAME)}
      hint={copy.sort.alreadyName(NAME)}
      nextLabel={copy.sort.addCount(linked.size, NAME)}
      nextDisabled={linked.size === 0}
    >
      <List variant="outlined">
        {lines.map((l) => {
          const on = linked.has(l.id);
          return (
            <ListRow
              key={l.id}
              title={l.title}
              sub={l.sub}
              end={
                <Chip
                  label={on ? copy.toast.added : copy.common.add}
                  variant={on ? "accent" : "tag"}
                  icon={on ? CheckIcon : undefined}
                  onClick={() => setLinked(toggle(linked, l.id))}
                />
              }
            />
          );
        })}
      </List>
    </WizardStep>
  );
}

const meta = {
  title: "Components/Wizard step",
  component: WizardStep,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          padding: "var(--space-xl) var(--layout-gutter) var(--space-lg)",
          overflowY: "auto",
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    title: copy.sort.person,
    step: 0,
    count: COUNT,
    stepLabel: copy.sort.stepOf(1, COUNT),
    question: copy.sort.nameQuestion.person,
    backLabel: copy.common.back,
    nextLabel: copy.add.addPerson,
    onNext: fn(),
  },
} satisfies Meta<typeof WizardStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NameStep: Story = { render: () => <Builder /> };
export const HowYouKnowStep: Story = { render: () => <Builder start={1} /> };
export const AddNotesStep: Story = { render: () => <Builder start={2} /> };
