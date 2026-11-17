import { css } from "@linaria/core";
import { useId } from "react";
import { Progress } from "radix-ui";
import clsx from "clsx";
import { mixStops, mixSurface } from "@/lib/design/area-mix.ts";

const number = css`
  margin: 0;
  font-family: var(--font-number);
  font-size: var(--font-size-number-xl);
  line-height: var(--font-leading-tight);
  letter-spacing: var(--font-tracking-tight);
  color: var(--text-number);
`;

const goalProgress = css`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-card);
  background: var(--background-secondary);
`;

const hasAreas = css`
  .${goalProgress}& {
    position: relative;
    isolation: isolate;
  }

  .${goalProgress}&::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background-image: var(--texture-noise);
    opacity: var(--opacity-noise-text);
    pointer-events: none;
  }

  .${goalProgress}& .${number} {
    color: var(--text-primary);
  }
`;

const text = css`
  display: grid;
  gap: var(--space-xs);
`;

const title = css`
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-display-lg);
  font-weight: var(--font-weight-regular);
  line-height: var(--font-leading-snug);
`;

const unit = css`
  font-size: var(--font-size-number-sm);
`;

const note = css`
  margin: 0;
  font-size: var(--font-size-body-sm);
  color: var(--text-secondary);
`;

const dial = css`
  position: relative;
  display: grid;
  place-items: center;
  width: var(--size-ring);
  height: var(--size-ring);

  & .${number} {
    position: absolute;
    font-size: var(--font-size-number-lg);
  }
`;

const ring = css`
  width: 100%;
  height: 100%;
  rotate: -90deg;
`;

const ringTrack = css`
  fill: none;
  stroke-width: var(--size-ring-stroke);
  stroke: var(--progress-track);
`;

const ringFill = css`
  fill: none;
  stroke-width: var(--size-ring-stroke);
  stroke-linecap: round;
  transition: stroke-dasharray var(--motion-slow) var(--motion-easing);
`;

const stopStart = css`
  stop-color: var(--progress-fill-start);
`;

const stopEnd = css`
  stop-color: var(--progress-fill-end);
`;

export type GoalProgressProps = {
  title: string;
  value: number;
  note?: string;
  areas?: string[];
};

const Ring = ({ percent, areas }: { percent: number; areas?: string[] }) => {
  const id = useId();
  return (
    <svg className={ring} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {areas?.length ? (
            mixStops(areas).map((s) => (
              <stop key={s.offset} offset={`${s.offset}%`} style={{ stopColor: s.colour }} />
            ))
          ) : (
            <>
              <stop offset="0%" className={stopStart} />
              <stop offset="100%" className={stopEnd} />
            </>
          )}
        </linearGradient>
      </defs>
      <circle className={ringTrack} cx="50" cy="50" r="42" pathLength="100" />
      <circle
        className={ringFill}
        cx="50"
        cy="50"
        r="42"
        pathLength="100"
        stroke={`url(#${id})`}
        style={{ strokeDasharray: `${percent} 100` }}
      />
    </svg>
  );
};

export const GoalProgress = ({
  title: heading,
  value,
  note: noteText,
  areas,
}: GoalProgressProps) => {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <section
      className={clsx(goalProgress, areas?.length && hasAreas)}
      aria-label={heading}
      style={areas?.length ? { backgroundImage: mixSurface(areas) } : undefined}
    >
      <Progress.Root className={dial} value={percent} aria-label={`${heading}: ${percent}%`}>
        <Ring percent={percent} areas={areas} />
        <p className={number} aria-hidden>
          {percent}
          <span className={unit}>%</span>
        </p>
      </Progress.Root>
      <div className={text}>
        <h3 className={title}>{heading}</h3>
        {noteText && <p className={note}>{noteText}</p>}
      </div>
    </section>
  );
};
