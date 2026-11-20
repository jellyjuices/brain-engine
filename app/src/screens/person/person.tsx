import { useState } from "react";
import { WizardStep } from "@/components/wizard-step/wizard-step.tsx";
import { addRelations } from "@/flows/build-flow.ts";
import { useNotes } from "@/hooks/use-notes.ts";
import { useRoute } from "@/hooks/use-route.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { go } from "@/lib/platform/router.ts";
import { PersonKnow } from "./person-know.tsx";
import { PersonNotes } from "./person-notes.tsx";
import { copy } from "@/content/index.ts";

const COUNT = 3;

export function PersonScreen() {
  const { rest: path } = useRoute();
  const notes = useNotes();
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState<Set<string>>(new Set());
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const person = notes?.find((n) => n.path === path);
  if (!notes || !person) return null;
  const name = person.title;
  const picked = notes.filter((n) => subjects.has(n.path)).map((n) => n.title);

  function leave() {
    go(noteHref(path), true);
  }

  async function next() {
    setBusy(true);
    const ok =
      step === 1
        ? await addRelations(
            [...subjects].map((to) => [path, to]),
            picked.join(", "),
          )
        : await addRelations(
            [...linked].map((from) => [from, path]),
            name,
          );
    setBusy(false);
    if (!ok) return;
    if (step === 1) setStep(2);
    else leave();
  }

  const shared = {
    title: copy.sort.person,
    step,
    count: COUNT,
    stepLabel: copy.sort.stepOf(step + 1, COUNT),
    backLabel: copy.common.back,
    skipLabel: copy.sort.skip,
    closeLabel: copy.common.close,
    nextDisabled: busy,
    onClose: leave,
    onNext: () => void next(),
    onSkip: step === 1 ? () => setStep(2) : leave,
  };

  if (step === 1)
    return (
      <WizardStep
        {...shared}
        question={copy.sort.howKnow(name)}
        hint={copy.sort.pickAny}
        nextLabel={copy.sort.next}
      >
        <PersonKnow notes={notes} person={person} picked={subjects} onChange={setSubjects} />
      </WizardStep>
    );
  return (
    <WizardStep
      {...shared}
      question={copy.sort.addNotesTo(name)}
      hint={copy.sort.alreadyName(name)}
      nextLabel={linked.size ? copy.sort.addCount(linked.size, name) : copy.common.done}
      onBack={() => setStep(1)}
    >
      <PersonNotes notes={notes} person={person} picked={linked} onChange={setLinked} />
    </WizardStep>
  );
}
