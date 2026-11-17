import { useRef } from "react";
import { go } from "@/lib/platform/router.ts";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { kindLook, type KindName } from "@/lib/notes/kinds.ts";
import { FilePicker } from "@/components/file-picker/file-picker.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { addFile, addPersonFlow, addSubjectFlow } from "@/flows/new-flow.ts";
import { copy } from "@/content/index.ts";

type ChoiceId = Extract<KindName, "intake" | "person" | "place" | "thing" | "file">;

const CHOICES: { id: ChoiceId; label: string; hint?: string }[] = [
  { id: "intake", label: copy.nav.intake, hint: copy.add.intakeHint },
  { id: "person", label: copy.add.person },
  { id: "place", label: copy.add.place },
  { id: "thing", label: copy.add.thing },
  { id: "file", label: copy.add.file, hint: copy.add.fileHint },
];

export function NewScreen() {
  const picker = useRef<HTMLInputElement>(null);

  function choose(id: ChoiceId) {
    if (id === "intake") go("/intake");
    else if (id === "person") void addPersonFlow();
    else if (id === "place") void addSubjectFlow("Place");
    else if (id === "thing") void addSubjectFlow("Thing");
    else picker.current?.click();
  }

  return (
    <>
      <PageHeader title={copy.add.newTitle} />
      <List>
        {CHOICES.map((c) => (
          <Row
            key={c.id}
            {...kindLook(c.id)}
            title={c.label}
            sub={c.hint}
            chevron
            onClick={() => choose(c.id)}
          />
        ))}
      </List>
      <FilePicker inputRef={picker} onFile={(file) => void addFile(file)} />
    </>
  );
}
