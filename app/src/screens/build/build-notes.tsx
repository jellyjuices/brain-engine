import { CheckIcon } from "@phosphor-icons/react";
import { Chip } from "@/components/chip/chip.tsx";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import type { StoredNote } from "@/lib/notes/model.ts";
import { namingNotes } from "@/lib/notes/build-links.ts";
import { toggled } from "@/lib/notes/toggled.ts";
import { copy } from "@/content/index.ts";

export function BuildNotes({
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
  const hits = namingNotes(notes, built);
  if (hits.length === 0) return <EmptyState title={copy.sort.noneNamed(built.title)} size="sm" />;
  return (
    <List variant="outlined">
      {hits.map((h) => {
        const on = picked.has(h.note.path);
        return (
          <ListRow
            key={h.note.path}
            title={h.line}
            sub={`${h.todo ? copy.sort.todo : (h.note.type ?? copy.common.note)} · ${h.note.title}`}
            end={
              <Chip
                label={on ? copy.toast.added : copy.common.add}
                variant={on ? "accent" : "tag"}
                icon={on ? CheckIcon : undefined}
                onClick={() => onChange(toggled(picked, h.note.path))}
              />
            }
          />
        );
      })}
    </List>
  );
}
