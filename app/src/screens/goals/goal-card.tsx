import { SectionHeader } from "@/components/section-header/section-header.tsx";
import { GoalProgress } from "@/components/goal-progress/goal-progress.tsx";
import { GoalStepRow } from "@/components/goal-step-row/goal-step-row.tsx";
import { SubgoalLink } from "@/components/subgoal-link/subgoal-link.tsx";
import { List } from "@/components/list/list.tsx";
import { ListRow } from "@/components/list/list-row.tsx";
import type { GoalView } from "@shared/todos/index.ts";
import { goalHref, titleAt } from "@/lib/notes/goals.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { noteHref } from "@/lib/notes/model.ts";
import styles from "./goals.module.css";
import { copy } from "@/content/index.ts";

export interface GoalCardProps {
  goal: GoalView;
  notes: StoredNote[] | null;
}

export function GoalCard({ goal, notes }: GoalCardProps) {
  const next = goal.next;
  return (
    <article className={styles.card} aria-label={goal.title}>
      <h2 className={styles.title}>
        <a href={goalHref(goal.path)}>{goal.title}</a>
      </h2>
      <GoalProgress goal={goal} />
      {next && (
        <section aria-label={copy.goals.nextStep}>
          <SectionHeader title={copy.goals.nextStep} as="h3" />
          <List variant="plain">
            <GoalStepRow step={next} goal={goal.title} subject={titleAt(notes, next.path)} />
          </List>
        </section>
      )}
      {goal.subgoals.map((sub) => (
        <SubgoalLink key={sub.path} goal={sub} />
      ))}
      {goal.decisions.length > 0 && (
        <section aria-label={copy.goals.decisions}>
          <SectionHeader title={copy.goals.decisions} as="h3" />
          <List>
            {goal.decisions.map((d) => (
              <ListRow key={d.path} title={d.title} href={noteHref(d.path)} chevron />
            ))}
          </List>
        </section>
      )}
    </article>
  );
}
