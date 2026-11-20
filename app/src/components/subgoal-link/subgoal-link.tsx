import styles from "./subgoal-link.module.css";
import { ProgressBar } from "@/components/progress-bar/progress-bar.tsx";
import type { GoalRef } from "@shared/todos/index.ts";
import { goalHref } from "@/lib/notes/goals.ts";

export function SubgoalLink({ goal }: { goal: GoalRef }) {
  return (
    <a className={styles.link} href={goalHref(goal.path)}>
      {goal.title}
      <ProgressBar label={goal.title} done={goal.done} total={goal.total} size="step" />
    </a>
  );
}
