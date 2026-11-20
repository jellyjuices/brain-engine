import { List } from "@/components/list/list.tsx";
import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import type { TodoView } from "@shared/todos/index.ts";
import { groupView, type ViewTodo } from "@/lib/notes/todo-views.ts";
import { TodoListRow } from "./todo-list-row.tsx";
import styles from "./todos.module.css";

export interface TodosListProps {
  view: TodoView;
  items: ViewTodo[];
  now: string;
  empty: string;
}

const SUBJECT_GROUPS: readonly TodoView[] = ["no-date", "all"];

export function TodosList({ view, items, now, empty }: TodosListProps) {
  if (!items.length) return <EmptyState title={empty} />;
  const showSubject = !SUBJECT_GROUPS.includes(view);
  return groupView(view, items, now).map((g) => (
    <section key={g.key} className={styles.group} aria-label={g.title}>
      <SectionHeader title={g.title} count={g.items.length} tone={g.late ? "late" : "default"} />
      <List variant="plain">
        {g.items.map((todo) => (
          <TodoListRow key={todo.ref} todo={todo} now={now} showSubject={showSubject} />
        ))}
      </List>
    </section>
  ));
}
