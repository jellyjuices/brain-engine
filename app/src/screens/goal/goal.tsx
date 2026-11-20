import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { PageHeader } from "@/components/page-header/page-header.tsx";
import { useLoaded } from "@/hooks/use-loaded.ts";
import { useNotes } from "@/hooks/use-notes.ts";
import { useRoute } from "@/hooks/use-route.ts";
import { fetchGoal } from "@/lib/sync/goals-api.ts";
import { Chip } from "@/components/chip/chip.tsx";
import { Chips } from "@/components/chip/chips.tsx";
import { areaLabel } from "@/lib/design/area-mix.ts";
import { GoalBody } from "./goal-body.tsx";
import styles from "./goal.module.css";
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
        areas={goal.kind === "ready" ? goal.data.areas : undefined}
      >
        {goal.kind === "ready" && goal.data.areas.length > 0 && (
          <div className={styles.areas}>
            <Chips>
              {goal.data.areas.map((a) => (
                <Chip key={a} label={areaLabel(a)} areas={[a]} />
              ))}
            </Chips>
          </div>
        )}
      </PageHeader>
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
