import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/button.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { go } from "@/lib/platform/router.ts";
import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { useLoaded } from "@/hooks/use-loaded.ts";
import { useNotes } from "@/hooks/use-notes.ts";
import { fetchGoals } from "@/lib/sync/goals-api.ts";
import { GoalCard } from "./goal-card.tsx";
import styles from "./goals.module.css";
import { copy } from "@/content/index.ts";

export function GoalsScreen() {
  const goals = useLoaded(fetchGoals, "goals");
  const notes = useNotes();
  return (
    <>
      <PageHeader
        title={copy.goals.title}
        action={
          <Button variant="outlined" icon={PlusIcon} onClick={() => go("/build/goal")}>
            {copy.goals.addGoal}
          </Button>
        }
      />
      <div className={styles.body}>
        {(goals.kind === "offline" || goals.kind === "missing") && (
          <EmptyState title={copy.goals.offlineTitle} body={copy.goals.offlineBody} />
        )}
        {goals.kind === "ready" && goals.data.length === 0 && (
          <EmptyState title={copy.goals.noGoalsTitle} body={copy.goals.noGoalsBody} />
        )}
        {goals.kind === "ready" &&
          goals.data.map((goal) => <GoalCard key={goal.path} goal={goal} notes={notes} />)}
      </div>
    </>
  );
}
