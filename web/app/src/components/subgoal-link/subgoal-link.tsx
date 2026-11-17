import { css } from "@linaria/core";
import { Bar } from "@/components/bar/bar.tsx";
import { goalHref, type GoalRef } from "@/lib/notes/goals.ts";

const link = css`
  display: grid;
  gap: var(--space-xs);
  color: var(--text-primary);
  text-decoration: none;
  font-size: var(--font-size-body-sm);
`;

export function SubgoalLink({ goal }: { goal: GoalRef }) {
  return (
    <a className={link} href={goalHref(goal.path)}>
      {goal.title}
      <Bar label={goal.title} done={goal.done} total={goal.total} size="step" />
    </a>
  );
}
