import { useState } from "react";
import { Button } from "@/components/button/button.tsx";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { GoalTodos } from "@/components/goal-todos/goal-todos.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { addTodosToGoal } from "@/flows/goal-link-flow.ts";
import { useNotes } from "@/hooks/use-notes.ts";
import { useRoute } from "@/hooks/use-route.ts";
import { openTodoPicks, type TodoPick } from "@/lib/notes/goal-link.ts";
import { goalHref } from "@/lib/notes/goals.ts";
import styles from "./goal-todos.module.css";
import { copy } from "@/content/index.ts";

export function GoalTodosScreen() {
  const { rest } = useRoute();
  const notes = useNotes();
  const [items, setItems] = useState<TodoPick[]>([]);
  const [busy, setBusy] = useState(false);
  if (!notes) return null;
  const goal = notes.find((n) => n.path === rest && n.type === "Goal");

  async function add() {
    if (!goal) return;
    setBusy(true);
    if (!(await addTodosToGoal(goal, items))) setBusy(false);
  }

  if (!goal)
    return (
      <>
        <PageHeader title={copy.goals.addTodosTitle} fallback="/goals" />
        <EmptyState title={copy.goals.missingTitle} body={copy.goals.missingBody} />
      </>
    );
  return (
    <>
      <PageHeader
        title={copy.goals.addTodosTitle}
        kicker={goal.title}
        fallback={goalHref(goal.path)}
      />
      <div className={styles.body}>
        <p className={styles.hint}>{copy.goals.addTodosHint}</p>
        <GoalTodos choices={openTodoPicks(notes, goal.path)} items={items} onChange={setItems} />
        <Button size="lg" block disabled={busy || items.length === 0} onClick={() => void add()}>
          {copy.goals.addTodosTo(items.length, goal.title)}
        </Button>
      </div>
    </>
  );
}
