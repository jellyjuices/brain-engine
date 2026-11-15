import { useId } from 'react'
import { Progress } from 'radix-ui'
import clsx from 'clsx'
import { mixStops, mixSurface } from '../../lib/area-mix.ts'
import './goal-progress.css'

export type GoalProgressProps = {
  title: string
  value: number
  note?: string
  areas?: string[]
}

const Ring = ({ percent, areas }: { percent: number; areas?: string[] }) => {
  const id = useId()
  return (
    <svg className="goal-progress-ring" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {areas?.length ? (
            mixStops(areas).map((s) => <stop key={s.offset} offset={`${s.offset}%`} style={{ stopColor: s.colour }} />)
          ) : (
            <>
              <stop offset="0%" className="goal-progress-stop-start" />
              <stop offset="100%" className="goal-progress-stop-end" />
            </>
          )}
        </linearGradient>
      </defs>
      <circle className="goal-progress-ring-track" cx="50" cy="50" r="42" pathLength="100" />
      <circle
        className="goal-progress-ring-fill"
        cx="50"
        cy="50"
        r="42"
        pathLength="100"
        stroke={`url(#${id})`}
        style={{ strokeDasharray: `${percent} 100` }}
      />
    </svg>
  )
}

export const GoalProgress = ({ title, value, note, areas }: GoalProgressProps) => {
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <section
      className={clsx('goal-progress', areas?.length && 'has-areas')}
      aria-label={title}
      style={areas?.length ? { backgroundImage: mixSurface(areas) } : undefined}
    >
      <Progress.Root className="goal-progress-dial" value={percent} aria-label={`${title}: ${percent}%`}>
        <Ring percent={percent} areas={areas} />
        <p className="goal-progress-number" aria-hidden>
          {percent}
          <span className="goal-progress-unit">%</span>
        </p>
      </Progress.Root>
      <div className="goal-progress-text">
        <h3 className="goal-progress-title">{title}</h3>
        {note && <p className="goal-progress-note">{note}</p>}
      </div>
    </section>
  )
}
