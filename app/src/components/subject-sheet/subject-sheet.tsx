import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { copy } from "@/content/index.ts";

const COPY = {
  Place: { title: copy.add.addPlace, placeholder: copy.add.placePlaceholder },
  Thing: { title: copy.add.addThing, placeholder: copy.add.thingPlaceholder },
};

export function subjectSheet(type: keyof typeof COPY): Promise<string | null> {
  return openSheet<string>(COPY[type].title, (finish) => (
    <SubjectForm type={type} finish={finish} />
  ));
}

function SubjectForm({
  type,
  finish,
}: {
  type: keyof typeof COPY;
  finish: (v: string | null) => void;
}) {
  const [name, setName] = useState("");
  const ok = name.trim().length > 0;
  function save() {
    if (ok) finish(name.trim());
  }
  return (
    <>
      <SheetHead title={COPY[type].title} />
      <TextField
        label={copy.add.name}
        placeholder={COPY[type].placeholder}
        autoFocus
        value={name}
        onChange={setName}
        onEnter={save}
      />
      <SheetActions>
        <Button disabled={!ok} onClick={save}>
          {copy.common.add}
        </Button>
      </SheetActions>
    </>
  );
}
