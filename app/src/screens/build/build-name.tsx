import { DateField } from "@/components/date-field/date-field.tsx";
import { TextField } from "@/components/field/text-field.tsx";
import type { BuildKind } from "@/lib/notes/build-kinds.ts";
import { todayIso } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";

const PLACEHOLDER = {
  person: copy.add.personPlaceholder,
  place: copy.add.placePlaceholder,
  thing: copy.add.thingPlaceholder,
};

export function BuildName({
  kind,
  name,
  day,
  onName,
  onDay,
}: {
  kind: BuildKind;
  name: string;
  day: string;
  onName: (name: string) => void;
  onDay: (day: string) => void;
}) {
  return (
    <>
      <TextField
        label={copy.add.name}
        placeholder={PLACEHOLDER[kind]}
        autoCapitalize={kind === "person" ? "words" : undefined}
        autoFocus
        value={name}
        onChange={onName}
      />
      {kind === "person" && (
        <DateField
          label={copy.add.birthdayOptional}
          value={day || undefined}
          onChange={onDay}
          max={todayIso()}
          yearSteps
        />
      )}
    </>
  );
}
