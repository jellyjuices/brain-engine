import {
  BookOpenIcon,
  CheckSquareIcon,
  FileTextIcon,
  HouseIcon,
  PackageIcon,
  ChatCircleDotsIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { useRef } from "react";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { FilePicker } from "@/components/file-picker/file-picker.tsx";
import { ScreenHead } from "@/components/screen-head/screen-head.tsx";
import { addFile, addPersonFlow, addSubjectFlow } from "@/flows/new-flow.ts";
import { go } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

type ChoiceId = "todo" | "journal" | "intake" | "person" | "place" | "thing" | "file";

const CHOICES: { id: ChoiceId; icon: PhosphorIcon; label: string; hint?: string }[] = [
  { id: "todo", icon: CheckSquareIcon, label: copy.add.todo, hint: copy.add.todoHint },
  {
    id: "journal",
    icon: BookOpenIcon,
    label: copy.add.journal,
    hint: copy.add.journalHint,
  },
  { id: "intake", icon: ChatCircleDotsIcon, label: copy.nav.intake, hint: copy.add.intakeHint },
  { id: "person", icon: UserPlusIcon, label: copy.add.person },
  { id: "place", icon: HouseIcon, label: copy.add.place },
  { id: "thing", icon: PackageIcon, label: copy.add.thing },
  { id: "file", icon: FileTextIcon, label: copy.add.file, hint: copy.add.fileHint },
];

export function NewScreen() {
  const picker = useRef<HTMLInputElement>(null);

  function choose(id: ChoiceId) {
    if (id === "todo") go("/add");
    else if (id === "journal") go("/write");
    else if (id === "intake") go("/intake");
    else if (id === "person") void addPersonFlow();
    else if (id === "place") void addSubjectFlow("Place");
    else if (id === "thing") void addSubjectFlow("Thing");
    else picker.current?.click();
  }

  return (
    <>
      <ScreenHead title={copy.add.newTitle} />
      <List>
        {CHOICES.map((c) => (
          <Row
            key={c.id}
            icon={c.icon}
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
