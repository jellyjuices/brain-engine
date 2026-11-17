import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { ViewTabs } from "@/components/view-tabs/view-tabs.tsx";
import { Pull } from "@/components/pull/pull.tsx";
import { SyncLine } from "@/components/sync-line/sync-line.tsx";
import { longDate } from "@/lib/notes/model.ts";
import { isTodoView, TODO_VIEWS, type TodoViewId } from "@/lib/notes/todo-views.ts";
import { TodosList } from "./todos-list.tsx";
import { useTodoView } from "./use-todo-view.ts";
import * as styles from "./todos.styles.ts";
import { copy } from "@/content/index.ts";

const EMPTY: Record<TodoViewId, string> = {
  today: copy.todos.emptyToday,
  soon: copy.todos.emptySoon,
  "no-date": copy.todos.emptyNoDate,
  "on-hold": copy.todos.emptyOnHold,
  "by-goal": copy.todos.emptyByGoal,
  all: copy.todos.emptyAll,
};

const TABS = TODO_VIEWS.map((v) => ({ value: v.id, label: v.label }));

export function TodosScreen() {
  const [view, setView] = useState<TodoViewId>("today");
  const { now, items, noDate, refresh } = useTodoView(view);

  return (
    <>
      <Pull onRefresh={refresh} />
      <PageHeader title={copy.todos.title} kicker={longDate(now)}>
        <ViewTabs
          views={TABS}
          value={view}
          onValueChange={(next) => isTodoView(next) && setView(next)}
          label={copy.todos.views}
        />
      </PageHeader>
      <SyncLine />
      <div className={styles.body}>
        {items && <TodosList view={view} items={items} now={now} empty={EMPTY[view]} />}
        {view === "today" && noDate > 0 && (
          <div className={styles.more}>
            <Button variant="ghost" size="sm" onClick={() => setView("no-date")}>
              {copy.todos.moreNoDate(noDate)}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
