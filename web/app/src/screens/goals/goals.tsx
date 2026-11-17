import { PageHeader } from "@ds/components/page-header/page-header.tsx";
import { Empty } from "@/components/empty/empty.tsx";
import { useLoaded } from "@/hooks/use-loaded.ts";
import { useNotes } from "@/hooks/use-notes.ts";
import { fetchGoals } from "@/lib/sync/goals-api.ts";
import { GoalCard } from "./goal-card.tsx";
import * as styles from "./goals.styles.ts";
import { copy } from "@/content/index.ts";

export function GoalsScreen() {
  const goals = useLoaded(fetchGoals, "goals");
  const notes = useNotes();
  return (
    <>
      <PageHeader title={copy.goals.title} />
      <div className={styles.body}>
        {(goals.kind === "offline" || goals.kind === "missing") && (
          <Empty title={copy.goals.offlineTitle} body={copy.goals.offlineBody} />
        )}
        {goals.kind === "ready" && goals.data.length === 0 && (
          <Empty title={copy.goals.noGoalsTitle} body={copy.goals.noGoalsBody} />
        )}
        {goals.kind === "ready" &&
          goals.data.map((goal) => <GoalCard key={goal.path} goal={goal} notes={notes} />)}
      </div>
    </>
  );
}
