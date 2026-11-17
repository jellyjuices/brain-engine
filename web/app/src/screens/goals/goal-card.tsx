import { Bar } from "@ds/components/bar/bar.tsx";
import { SectionHeader } from "@ds/components/section-header/section-header.tsx";
import { GoalStep } from "@/components/goal-step/goal-step.tsx";
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
      <Bar
        label={goal.title}
        showLabel={false}
        done={goal.done}
        total={goal.total}
        countLabel={copy.goals.count(goal.done, goal.total)}
        gain={goal.recent}
        gainLabel={copy.goals.thisMonth}
        areas={goal.areas}
      />
      {next && (
        <section aria-label={copy.goals.nextStep}>
          <SectionHeader title={copy.goals.nextStep} as="h3" />
          <ul className={styles.list}>
            <GoalStep step={next} goal={goal.title} subject={titleAt(notes, next.path)} />
          </ul>
        </section>
      )}
      {goal.subgoals.map((sub) => (
        <a key={sub.path} className={styles.sub} href={goalHref(sub.path)}>
          {sub.title}
          <Bar label={sub.title} done={sub.done} total={sub.total} size="step" />
        </a>
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
