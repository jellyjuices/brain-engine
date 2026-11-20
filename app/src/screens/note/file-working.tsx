import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import { copy } from "@/content/index.ts";

export function FileWorking({ title }: { title: string }) {
  return (
    <List variant="outlined">
      <ListRow title={title} sub={copy.sort.canLeave} busy />
    </List>
  );
}
