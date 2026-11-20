import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { Calendar } from "@/components/calendar/calendar.tsx";
import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { NameForm, type Named } from "@/components/subject-sheet/name-form.tsx";
import { todayIso } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export function birthdaySheet(name: string): Promise<string | null> {
  return openSheet<string>(copy.add.birthday, (finish) => (
    <BirthdayForm name={name} finish={finish} />
  ));
}

function BirthdayForm({ name, finish }: { name: string; finish: (v: string | null) => void }) {
  const [day, setDay] = useState("");
  const today = todayIso();
  return (
    <>
      <SheetHead title={copy.add.birthdayOf(name)} />
      <Calendar today={today} value={day || undefined} max={today} yearSteps onPick={setDay} />
      <SheetActions>
        <Button disabled={!day} onClick={() => finish(day)}>
          {copy.common.save}
        </Button>
      </SheetActions>
    </>
  );
}

export type NewPerson = Named;

export function personSheet(): Promise<NewPerson | null> {
  return openSheet<NewPerson>(copy.add.addPerson, (finish) => (
    <NameForm
      title={copy.add.addPerson}
      placeholder={copy.add.personPlaceholder}
      person
      onSave={finish}
    />
  ));
}
