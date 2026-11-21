import { EmptyState } from "@/components/empty-state/empty-state.tsx";
import { List } from "@/components/list/list.tsx";
import { AddTodoButton } from "./add-todo-button.tsx";
import { GoalProgress } from "@/components/goal-progress/goal-progress.tsx";
import { GoalStepRow } from "@/components/goal-step-row/goal-step-row.tsx";
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
      <GoalProgress goal={goal} />
      {goal.next && (
        <GoalSection title={copy.goals.nextStep}>
          <List variant="plain">
            <GoalStepRow
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
              <GoalStepRow
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
              <GoalStepRow
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
      {goal.targets.length === 0 && steps.length === 0 && (
        <EmptyState
          title={copy.goals.noTodosTitle}
          body={copy.goals.noTodosBody}
          action={<AddTodoButton path={goal.path} />}
        />
      )}
      <GoalLinks goal={goal} notes={notes} />
    </div>
  );
}
