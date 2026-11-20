import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { NameForm } from "./name-form.tsx";
import { copy } from "@/content/index.ts";

const COPY = {
  Place: { title: copy.add.addPlace, placeholder: copy.add.placePlaceholder },
  Thing: { title: copy.add.addThing, placeholder: copy.add.thingPlaceholder },
};

export function subjectSheet(type: keyof typeof COPY): Promise<string | null> {
  const { title, placeholder } = COPY[type];
  return openSheet<string>(title, (finish) => (
    <NameForm title={title} placeholder={placeholder} onSave={({ name }) => finish(name)} />
  ));
}
