import { CheckIcon } from "@phosphor-icons/react";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { typeLook } from "@/lib/notes/kinds.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { subjectChoices } from "@/lib/notes/build-links.ts";
import { toggled } from "@/lib/notes/toggled.ts";
import { copy } from "@/content/index.ts";

export function BuildKnow({
  notes,
  built,
  picked,
  onChange,
}: {
  notes: StoredNote[];
  built: StoredNote;
  picked: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { suggested, rest } = subjectChoices(notes, built);
  function rows(list: StoredNote[]) {
    return list.map((n) => (
      <ListRow
        key={n.path}
        {...typeLook(n.type)}
        title={n.title}
        sub={n.type}
        end={picked.has(n.path) && <CheckIcon aria-label={copy.sort.picked(n.title)} />}
        onClick={() => onChange(toggled(picked, n.path))}
      />
    ));
  }
  return (
    <>
      {suggested.length > 0 && (
        <>
          <SectionHeader title={copy.sort.suggestedList} as="h3" />
          <List variant="ghost">{rows(suggested)}</List>
        </>
      )}
      <SectionHeader title={copy.sort.allSubjects} as="h3" />
      <List variant="ghost">{rows(rest)}</List>
    </>
  );
}
