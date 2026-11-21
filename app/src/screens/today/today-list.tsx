import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { List } from "@/components/list/list.tsx";
import { TodoRefRow } from "@/components/todo-row/todo-ref-row.tsx";
import { makeTodo } from "@/lib/notes/todos.ts";
import { GROUPS, type TodayData } from "@/lib/notes/today.ts";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { copy } from "@/content/index.ts";

export function TodayList({ data }: { data: TodayData }) {
  if (!data.items.length) return <EmptyState title={copy.today.nothingToday} />;
  return (
    <div>
      {GROUPS.map((g) => {
        const items = data.items.filter((i) => i.group === g.id);
        if (!items.length) return null;
        return (
          <section key={g.id} aria-label={g.label}>
            <SectionHeader title={g.label} tone={g.id === "overdue" ? "late" : "default"} />
            <List>
              {items.map((i) => (
                <TodoRefRow key={i.ref} todo={makeTodo(i)} surface="secondary" />
              ))}
            </List>
          </section>
        );
      })}
    </div>
  );
}
