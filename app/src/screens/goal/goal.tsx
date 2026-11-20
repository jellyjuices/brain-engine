import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { useLoaded } from "@/hooks/use-loaded.ts";
import { useNotes } from "@/hooks/use-notes.ts";
import { useRoute } from "@/hooks/use-route.ts";
import { fetchGoal } from "@/lib/sync/goals-api.ts";
import { GoalBody } from "./goal-body.tsx";
import { copy } from "@/content/index.ts";

export function GoalScreen() {
  const { rest } = useRoute();
  const goal = useLoaded(() => fetchGoal(rest), rest);
  const notes = useNotes();
  return (
    <>
      <PageHeader
        title={goal.kind === "ready" ? goal.data.title : copy.goals.kicker}
        kicker={copy.goals.kicker}
        fallback="/goals"
      />
      {goal.kind === "offline" && (
        <EmptyState title={copy.goals.offlineTitle} body={copy.goals.offlineBody} />
      )}
      {goal.kind === "missing" && (
        <EmptyState title={copy.goals.missingTitle} body={copy.goals.missingBody} />
      )}
      {goal.kind === "ready" && <GoalBody goal={goal.data} notes={notes} />}
    </>
  );
}
