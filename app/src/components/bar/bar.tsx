import { css } from "@linaria/core";
import clsx from "clsx";
import { Progress } from "radix-ui";
import { mixGradient } from "@/lib/design/area-mix.ts";
import { percentOf } from "@/lib/design/percent.ts";

const track = css`
  position: relative;
  overflow: hidden;
  height: var(--bar-goal);
  border-radius: var(--radius-control);
  background: var(--progress-track);
`;

const bar = css`
  display: grid;
  gap: var(--space-sm);
`;

const sizes = {
  goal: "",
  step: css`
    & .${track} {
      height: var(--bar-step);
    }
  `,
};

const head = css`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "label label"
    "number facts";
  align-items: end;
  gap: var(--space-xs) var(--space-md);
`;

const label = css`
  grid-area: label;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-display-sm);
  line-height: var(--font-leading-snug);
`;

const number = css`
  grid-area: number;
  margin: 0;
  font-family: var(--font-number);
  font-size: var(--font-size-number-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--font-leading-tight);
  color: var(--text-primary);
`;

const unit = css`
  font-size: var(--font-size-number-lg);
`;

const facts = css`
  grid-area: facts;
  display: grid;
  justify-items: end;
  gap: var(--space-2xs);
  margin: 0;
  font-size: var(--font-size-body-sm);
  color: var(--text-secondary);
`;

const gainText = css`
  color: var(--text-primary);
`;

const gainNumber = css`
  font-family: var(--font-number);
  font-weight: var(--font-weight-bold);
`;

const fillBar = css`
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-progress);
  transition: width var(--motion-slow) var(--motion-easing);
`;

export type BarProps = {
  label: string;
  done: number;
  total: number;
  countLabel?: string;
  gain?: number;
  gainLabel?: string;
  areas?: string[];
  size?: "goal" | "step";
  showLabel?: boolean;
};

export const Bar = ({
  label: text,
  done,
  total,
  countLabel,
  gain,
  gainLabel,
  areas,
  size = "goal",
  showLabel = true,
}: BarProps) => {
  const percent = percentOf(done, total);
  const fill = areas?.length ? { background: mixGradient(areas, "fill", 90) } : {};
  return (
    <div className={clsx(bar, sizes[size])}>
      {size === "goal" && (
        <div className={head}>
          {showLabel && <p className={label}>{text}</p>}
          <p className={number} aria-hidden>
            {percent}
            <span className={unit}>%</span>
          </p>
          {(countLabel || gain !== undefined) && (
            <p className={facts}>
              {countLabel && <span>{countLabel}</span>}
              {gain !== undefined && gain > 0 && (
                <span className={gainText}>
                  <span className={gainNumber}>+{gain}</span> {gainLabel}
                </span>
              )}
            </p>
          )}
        </div>
      )}
      <Progress.Root
        className={track}
        value={percent}
        aria-label={text}
        getValueLabel={(value) => `${value}%`}
      >
        <Progress.Indicator className={fillBar} style={{ width: `${percent}%`, ...fill }} />
      </Progress.Root>
    </div>
  );
};
