import { CheckIcon } from "@phosphor-icons/react";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { typeLook } from "@/lib/notes/kinds.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { personSubjects } from "@/lib/notes/person-build.ts";
import { toggled } from "@/lib/notes/toggled.ts";
import { copy } from "@/content/index.ts";

export function PersonKnow({
  notes,
  person,
  picked,
  onChange,
}: {
  notes: StoredNote[];
  person: StoredNote;
  picked: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { suggested, rest } = personSubjects(notes, person);
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
