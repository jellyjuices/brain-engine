import clsx from 'clsx'
import { Progress } from 'radix-ui'
import { mixGradient } from '../../lib/area-mix.ts'
import { percentOf } from '../../lib/percent.ts'
import './bar.css'

export type BarProps = {
  label: string
  done: number
  total: number
  countLabel?: string
  gain?: number
  gainLabel?: string
  areas?: string[]
  size?: 'goal' | 'step'
  showLabel?: boolean
}

export const Bar = ({ label, done, total, countLabel, gain, gainLabel, areas, size = 'goal', showLabel = true }: BarProps) => {
  const percent = percentOf(done, total)
  const fill = areas?.length ? { background: mixGradient(areas, 'fill', 90) } : {}
  return (
    <div className={clsx('bar', `bar--${size}`)}>
      {size === 'goal' && (
        <div className="bar-head">
          {showLabel && <p className="bar-label">{label}</p>}
          <p className="bar-number" aria-hidden>
            {percent}
            <span className="bar-unit">%</span>
          </p>
          {(countLabel || gain !== undefined) && (
            <p className="bar-facts">
              {countLabel && <span>{countLabel}</span>}
              {gain !== undefined && gain > 0 && (
                <span className="bar-gain">
                  <span className="bar-gain-number">+{gain}</span> {gainLabel}
                </span>
              )}
            </p>
          )}
        </div>
      )}
      <Progress.Root className="bar-track" value={percent} aria-label={label} getValueLabel={(value) => `${value}%`}>
        <Progress.Indicator className="bar-fill" style={{ width: `${percent}%`, ...fill }} />
      </Progress.Root>
    </div>
  )
}
