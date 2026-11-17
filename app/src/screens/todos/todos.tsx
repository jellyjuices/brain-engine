import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { ViewTabs } from "@/components/view-tabs/view-tabs.tsx";
import { Pull } from "@/components/pull/pull.tsx";
import { SyncLine } from "@/components/sync-line/sync-line.tsx";
import { longDate } from "@/lib/notes/model.ts";
import { isTodoView, type TodoView } from "@shared/todos/index.ts";
import { TODO_VIEW_TABS } from "@/lib/notes/todo-views.ts";
import { SETTINGS } from "@/shell/places.ts";
import { PlaceLink } from "@/shell/place-link/place-link.tsx";
import { UnsortedBanner } from "@/shell/unsorted-banner/unsorted-banner.tsx";
import { useShellLayout } from "@/shell/use-shell-layout.ts";
import { TodosList } from "./todos-list.tsx";
import { useTodoView } from "./use-todo-view.ts";
import styles from "./todos.module.css";
import { copy } from "@/content/index.ts";

const EMPTY: Record<TodoView, string> = {
  today: copy.todos.emptyToday,
  soon: copy.todos.emptySoon,
  "no-date": copy.todos.emptyNoDate,
  "on-hold": copy.todos.emptyOnHold,
  "by-goal": copy.todos.emptyByGoal,
  all: copy.todos.emptyAll,
};

const TABS = TODO_VIEW_TABS.map((v) => ({ value: v.id, label: v.label }));

export function TodosScreen() {
  const [view, setView] = useState<TodoView>("today");
  const { now, items, noDate, refresh } = useTodoView(view);
  const wide = useShellLayout() === "wide";

  return (
    <>
      <Pull onRefresh={refresh} />
      <PageHeader
        title={copy.todos.title}
        kicker={longDate(now)}
        action={wide ? undefined : <PlaceLink place={SETTINGS} variant="icon" />}
      >
        <ViewTabs
          views={TABS}
          value={view}
          onValueChange={(next) => isTodoView(next) && setView(next)}
          label={copy.todos.views}
        />
      </PageHeader>
      <UnsortedBanner />
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
