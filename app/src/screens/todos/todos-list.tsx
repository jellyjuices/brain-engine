import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { Empty } from "@/components/empty/empty.tsx";
import type { TodoView } from "@shared/todos/index.ts";
import { groupView, type ViewTodo } from "@/lib/notes/todo-views.ts";
import { TodoLine } from "./todo-line.tsx";
import * as styles from "./todos.styles.ts";

export interface TodosListProps {
  view: TodoView;
  items: ViewTodo[];
  now: string;
  empty: string;
}

const SUBJECT_GROUPS: readonly TodoView[] = ["no-date", "all"];

export function TodosList({ view, items, now, empty }: TodosListProps) {
  if (!items.length) return <Empty title={empty} />;
  const showSubject = !SUBJECT_GROUPS.includes(view);
  return groupView(view, items, now).map((g) => (
    <section key={g.key} className={styles.group} aria-label={g.title}>
      <SectionHeader title={g.title} count={g.items.length} tone={g.late ? "late" : "default"} />
      <ul className={styles.list}>
        {g.items.map((todo) => (
          <TodoLine key={todo.ref} todo={todo} now={now} showSubject={showSubject} />
        ))}
      </ul>
    </section>
  ));
}
