import { Bar } from "@/components/bar/bar.tsx";
import type { GoalView } from "@/lib/notes/goals.ts";
import { copy } from "@/content/index.ts";

export function GoalBar({ goal }: { goal: GoalView }) {
  return (
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
  );
}
