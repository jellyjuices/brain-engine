import { useState } from "react";
import { TextField } from "@/components/field/text-field.tsx";
import { WizardStep } from "@/components/wizard-step/wizard-step.tsx";
import { saveGoal } from "@/flows/goal-build-flow.ts";
import { useNotes } from "@/hooks/use-notes.ts";
import { areaChoices, pickedTitles } from "@/lib/notes/goal-draft.ts";
import { openTodoPicks, type TodoPick } from "@/lib/notes/goal-link.ts";
import { back } from "@/lib/platform/router.ts";
import { GoalTodos } from "@/components/goal-todos/goal-todos.tsx";
import { GoalAreas } from "./goal-areas.tsx";
import { copy } from "@/content/index.ts";

const COUNT = 4;
const words = copy.goals.build;

export function GoalBuild() {
  const notes = useNotes();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [todos, setTodos] = useState<TodoPick[]>([]);
  const [areas, setAreas] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  if (!notes) return null;
  const choices = areaChoices(notes);
  const name = title.trim();

  async function add() {
    setBusy(true);
    const targets = todos.filter((t) => !t.path).map((t) => t.text);
    const ok = await saveGoal(
      { title: name, why, targets, areas: [...areas] },
      todos.filter((t) => t.path),
    );
    if (!ok) setBusy(false);
  }

  const shared = {
    title: words.title,
    step,
    count: COUNT,
    stepLabel: copy.sort.stepOf(step + 1, COUNT),
    backLabel: copy.common.back,
    nextLabel: words.next,
    onClose: step > 0 ? () => setStep(step - 1) : back,
    onNext: () => (step < COUNT - 1 ? setStep(step + 1) : void add()),
  };
  const skip = { skipLabel: copy.sort.skip, onSkip: () => setStep(step + 1) };

  if (step === 0)
    return (
      <WizardStep
        {...shared}
        question={words.nameQuestion}
        hint={words.nameHint}
        nextDisabled={!name}
      >
        <TextField
          label={words.name}
          placeholder={words.namePlaceholder}
          autoFocus
          value={title}
          onChange={setTitle}
        />
      </WizardStep>
    );
  if (step === 1)
    return (
      <WizardStep {...shared} {...skip} question={words.whyQuestion(name)} hint={words.whyHint}>
        <TextField label={words.whyLabel} multiline autoFocus value={why} onChange={setWhy} />
      </WizardStep>
    );
  if (step === 2)
    return (
      <WizardStep {...shared} {...skip} question={words.todosQuestion(name)} hint={words.todosHint}>
        <GoalTodos choices={openTodoPicks(notes)} items={todos} onChange={setTodos} />
      </WizardStep>
    );
  return (
    <WizardStep
      {...shared}
      question={words.areasQuestion(name)}
      hint={copy.sort.pickAny}
      nextDisabled={busy || areas.size === 0}
      nextLabel={areas.size ? words.addTo(name, pickedTitles(choices, areas)) : copy.goals.addGoal}
    >
      <GoalAreas areas={choices} picked={areas} onChange={setAreas} />
    </WizardStep>
  );
}
