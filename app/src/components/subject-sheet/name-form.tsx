import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { DateField } from "@/components/date-field/date-field.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import { SheetActions } from "@/components/sheet/sheet-actions.tsx";
import { SheetHead } from "@/components/sheet/sheet-head.tsx";
import { todayIso } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

export interface Named {
  name: string;
  birthday?: string;
}

export interface NameFormProps {
  title: string;
  placeholder: string;
  person?: boolean;
  onSave: (named: Named) => void;
}

export function NameForm({ title, placeholder, person, onSave }: NameFormProps) {
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const ok = name.trim().length > 0;

  function save() {
    if (ok) onSave({ name: name.trim(), ...(day && { birthday: day }) });
  }

  return (
    <>
      <SheetHead title={title} />
      <TextField
        label={copy.add.name}
        placeholder={placeholder}
        autoCapitalize={person ? "words" : undefined}
        autoFocus
        value={name}
        onChange={setName}
        onEnter={save}
      />
      {person && (
        <DateField
          label={copy.add.birthdayOptional}
          value={day || undefined}
          onChange={setDay}
          max={todayIso()}
          yearSteps
        />
      )}
      <SheetActions>
        <Button disabled={!ok} onClick={save}>
          {copy.common.add}
        </Button>
      </SheetActions>
    </>
  );
}
