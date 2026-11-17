import { List } from "@/components/row/list.tsx";
import { GoalBar } from "@/components/goal-bar/goal-bar.tsx";
import { GoalStep } from "@/components/goal-step/goal-step.tsx";
import type { GoalView } from "@shared/todos/index.ts";
import { openSteps, titleAt } from "@/lib/notes/goals.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { GoalLinks } from "./goal-links.tsx";
import { GoalSection } from "./goal-section.tsx";
import styles from "./goal.module.css";
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
          <List variant="plain">
            <GoalStep
              step={goal.next}
              goal={goal.title}
              subject={titleAt(notes, goal.next.path)}
              showSubject={goal.next.path !== goal.path}
            />
          </List>
        </GoalSection>
      )}
      {goal.targets.length > 0 && (
        <GoalSection title={copy.goals.targets} count={goal.targets.length}>
          <List variant="plain">
            {goal.targets.map((step) => (
              <GoalStep
                key={`${step.path}::${step.text}`}
                step={step}
                goal={goal.title}
                subject={titleAt(notes, step.path)}
              />
            ))}
          </List>
        </GoalSection>
      )}
      {steps.length > 0 && (
        <GoalSection title={copy.goals.todos} count={steps.length}>
          <List variant="plain">
            {steps.map((step) => (
              <GoalStep
                key={`${step.path}::${step.text}`}
                step={step}
                goal={goal.title}
                subject={titleAt(notes, step.path)}
                showSubject={step.path !== goal.path}
              />
            ))}
          </List>
        </GoalSection>
      )}
      <GoalLinks goal={goal} notes={notes} />
    </div>
  );
}
