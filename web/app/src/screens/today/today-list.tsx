import "./today.css";
import { List } from "@/components/row/list.tsx";
import { TodoRow } from "@/components/todo-row/todo-row.tsx";
import { makeTodo } from "@/lib/notes/loops.ts";
import { GROUPS, type TodayData } from "@/lib/notes/today.ts";
import { Empty } from "@/components/empty/empty.tsx";
import { copy } from "@/content/index.ts";

export function TodayList({ data }: { data: TodayData }) {
  if (!data.items.length) return <Empty title={copy.today.nothingToday} />;
  return (
    <div className="today-list">
      {GROUPS.map((g) => {
        const items = data.items.filter((i) => i.group === g.id);
        if (!items.length) return null;
        return (
          <section key={g.id} className={`group group--${g.id}`} aria-label={g.label}>
            <h2 className="section-label">{g.label}</h2>
            <List>
              {items.map((i) => (
                <TodoRow key={i.ref} todo={makeTodo(i)} overdue={g.id === "overdue"} />
              ))}
            </List>
          </section>
        );
      })}
    </div>
  );
}
