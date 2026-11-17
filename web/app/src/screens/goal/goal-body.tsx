import { GoalBar } from "@/components/goal-bar/goal-bar.tsx";
import { GoalStep } from "@/components/goal-step/goal-step.tsx";
import { openSteps, titleAt, type GoalView } from "@/lib/notes/goals.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { GoalLinks } from "./goal-links.tsx";
import { GoalSection } from "./goal-section.tsx";
import * as styles from "./goal.styles.ts";
import { copy } from "@/content/index.ts";

export interface GoalBodyProps {
  goal: GoalView;
  notes: StoredNote[] | null;
}

export function GoalBody({ goal, notes }: GoalBodyProps) {
  const steps = openSteps(goal);
  return (
    <div className={styles.body}>
      {goal.why && <p className={styles.why}>{goal.why}</p>}
      <GoalBar goal={goal} />
      {goal.next && (
        <GoalSection title={copy.goals.nextStep}>
          <ul className={styles.list}>
            <GoalStep
              step={goal.next}
              goal={goal.title}
              subject={titleAt(notes, goal.next.path)}
              showSubject={goal.next.path !== goal.path}
            />
          </ul>
        </GoalSection>
      )}
      {goal.targets.length > 0 && (
        <GoalSection title={copy.goals.targets} count={goal.targets.length}>
          <ul className={styles.list}>
            {goal.targets.map((step) => (
              <GoalStep
                key={`${step.path}::${step.text}`}
                step={step}
                goal={goal.title}
                subject={titleAt(notes, step.path)}
              />
            ))}
          </ul>
        </GoalSection>
      )}
      {steps.length > 0 && (
        <GoalSection title={copy.goals.todos} count={steps.length}>
          <ul className={styles.list}>
            {steps.map((step) => (
              <GoalStep
                key={`${step.path}::${step.text}`}
                step={step}
                goal={goal.title}
                subject={titleAt(notes, step.path)}
                showSubject={step.path !== goal.path}
              />
            ))}
          </ul>
        </GoalSection>
      )}
      <GoalLinks goal={goal} notes={notes} />
    </div>
  );
}
