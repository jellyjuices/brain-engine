import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { Calendar } from "@/components/calendar/calendar.tsx";
import { DateField } from "@/components/date-field/date-field.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
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

export interface NewPerson {
  name: string;
  birthday?: string;
}

export function personSheet(): Promise<NewPerson | null> {
  return openSheet<NewPerson>(copy.add.addPerson, (finish) => <PersonForm finish={finish} />);
}

function PersonForm({ finish }: { finish: (v: NewPerson | null) => void }) {
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const ok = name.trim().length > 0;
  function save() {
    if (ok) finish({ name: name.trim(), ...(day && { birthday: day }) });
  }
  return (
    <>
      <SheetHead title={copy.add.addPerson} />
      <TextField
        label={copy.add.name}
        placeholder={copy.add.personPlaceholder}
        autoCapitalize="words"
        autoFocus
        value={name}
        onChange={setName}
        onEnter={save}
      />
      <DateField
        label={copy.add.birthdayOptional}
        value={day || undefined}
        onChange={setDay}
        max={todayIso()}
        yearSteps
      />
      <SheetActions>
        <Button disabled={!ok} onClick={save}>
          {copy.common.add}
        </Button>
      </SheetActions>
    </>
  );
}
