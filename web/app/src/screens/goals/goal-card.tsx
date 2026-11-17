import { SectionHeader } from "@ds/components/section-header/section-header.tsx";
import { GoalBar } from "@/components/goal-bar/goal-bar.tsx";
import { GoalStep } from "@/components/goal-step/goal-step.tsx";
import { SubgoalLink } from "@/components/subgoal-link/subgoal-link.tsx";
import { List } from "@/components/row/list.tsx";
import { Row } from "@/components/row/row.tsx";
import { goalHref, titleAt, type GoalView } from "@/lib/notes/goals.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { noteHref } from "@/lib/notes/model.ts";
import * as styles from "./goals.styles.ts";
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
      <GoalBar goal={goal} />
      {next && (
        <section aria-label={copy.goals.nextStep}>
          <SectionHeader title={copy.goals.nextStep} as="h3" />
          <ul className={styles.list}>
            <GoalStep step={next} goal={goal.title} subject={titleAt(notes, next.path)} />
          </ul>
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
              <Row key={d.path} title={d.title} href={noteHref(d.path)} chevron />
            ))}
          </List>
        </section>
      )}
    </article>
  );
}
