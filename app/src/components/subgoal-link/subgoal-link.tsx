import styles from "./subgoal-link.module.css";
import { Bar } from "@/components/bar/bar.tsx";
import type { GoalRef } from "@shared/todos/index.ts";
import { goalHref } from "@/lib/notes/goals.ts";

export function SubgoalLink({ goal }: { goal: GoalRef }) {
  return (
    <a className={styles.link} href={goalHref(goal.path)}>
      {goal.title}
      <Bar label={goal.title} done={goal.done} total={goal.total} size="step" />
    </a>
  );
}
