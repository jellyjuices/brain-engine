import { ProgressBar } from "@/components/progress-bar/progress-bar.tsx";
import type { GoalView } from "@shared/todos/index.ts";
import { copy } from "@/content/index.ts";

export function GoalProgress({ goal }: { goal: GoalView }) {
  return (
    <ProgressBar
      label={goal.title}
      showLabel={false}
      done={goal.done}
      total={goal.total}
      countLabel={copy.goals.count(goal.done, goal.total)}
      gain={goal.recent}
      gainLabel={copy.goals.thisMonth}
      areas={goal.areas}
    />
  );
}
