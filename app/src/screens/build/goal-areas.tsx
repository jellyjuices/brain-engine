import { AreaSwatch } from "@/components/area-swatch/area-swatch.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import type { AreaChoice } from "@/lib/notes/goal-draft.ts";
import { toggled } from "@/lib/notes/toggled.ts";

export function GoalAreas({
  areas,
  picked,
  onChange,
}: {
  areas: AreaChoice[];
  picked: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  return (
    <List variant="ghost">
      {areas.map((a) => (
        <ListRow
          key={a.slug}
          title={a.title}
          checked={picked.has(a.slug)}
          end={<AreaSwatch areas={[a.slug]} size="sm" />}
          onClick={() => onChange(toggled(picked, a.slug))}
        />
      ))}
    </List>
  );
}
