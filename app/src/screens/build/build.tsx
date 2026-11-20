import { useState } from "react";
import { WizardStep } from "@/components/wizard-step/wizard-step.tsx";
import { findSubject, linkKnown, linkNotes, saveSubject } from "@/flows/build-flow.ts";
import { useNotes } from "@/hooks/use-notes.ts";
import { useRoute } from "@/hooks/use-route.ts";
import { isBuildKind } from "@/lib/notes/build-kinds.ts";
import { noteHref } from "@/lib/notes/model.ts";
import { back, go } from "@/lib/platform/router.ts";
import { BuildKnow } from "./build-know.tsx";
import { BuildName } from "./build-name.tsx";
import { BuildNotes } from "./build-notes.tsx";
import { copy } from "@/content/index.ts";

const COUNT = 3;
const TITLE = { person: copy.sort.person, place: copy.add.place, thing: copy.add.thing };
const ADD = { person: copy.add.addPerson, place: copy.add.addPlace, thing: copy.add.addThing };

export function BuildScreen() {
  const { rest } = useRoute();
  const notes = useNotes();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [path, setPath] = useState("");
  const [subjects, setSubjects] = useState<Set<string>>(new Set());
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!isBuildKind(rest) || !notes) return null;
  const kind = rest;
  const built = notes.find((n) => n.path === path);
  const title = built?.title ?? name.trim();
  const chosen = notes.filter((n) => subjects.has(n.path));

  function leave() {
    if (path) go(noteHref(path), true);
    else back();
  }

  async function next() {
    setBusy(true);
    const ok = await advance();
    setBusy(false);
    if (ok && step < COUNT - 1) setStep(step + 1);
    else if (ok) leave();
  }

  async function advance(): Promise<boolean> {
    if (step === 0) {
      if (!saved && !(await saveSubject(kind, name.trim(), day || undefined))) return false;
      setSaved(true);
      const made = await findSubject(kind, name.trim());
      if (made) setPath(made.path);
      return made !== null;
    }
    if (step === 1) return linkKnown(path, chosen);
    return linkNotes(path, [...linked], title);
  }

  const shared = {
    title: TITLE[kind],
    step,
    count: COUNT,
    stepLabel: copy.sort.stepOf(step + 1, COUNT),
    backLabel: copy.common.back,
    nextDisabled: busy || (step === 0 ? !name.trim() : !built),
    onClose: leave,
    onNext: () => void next(),
  };
  const skip = {
    skipLabel: copy.sort.skip,
    onSkip: () => (step < COUNT - 1 ? setStep(step + 1) : leave()),
  };

  if (step === 0)
    return (
      <WizardStep
        {...shared}
        question={copy.sort.nameQuestion[kind]}
        hint={copy.sort.nameHint}
        nextLabel={ADD[kind]}
      >
        <BuildName kind={kind} name={name} day={day} onName={setName} onDay={setDay} />
      </WizardStep>
    );
  if (!built) return null;
  if (step === 1)
    return (
      <WizardStep
        {...shared}
        {...skip}
        question={kind === "person" ? copy.sort.howKnow(title) : copy.sort.belongsWith(title)}
        hint={copy.sort.pickAny}
        nextDisabled={busy || chosen.length === 0}
        nextLabel={copy.sort.addKnown(
          title,
          chosen.map((n) => n.title),
        )}
      >
        <BuildKnow notes={notes} built={built} picked={subjects} onChange={setSubjects} />
      </WizardStep>
    );
  return (
    <WizardStep
      {...shared}
      {...skip}
      question={copy.sort.addNotesTo(title)}
      hint={copy.sort.alreadyName(title)}
      nextDisabled={busy || linked.size === 0}
      nextLabel={copy.sort.addCount(linked.size, title)}
    >
      <BuildNotes notes={notes} built={built} picked={linked} onChange={setLinked} />
    </WizardStep>
  );
}
