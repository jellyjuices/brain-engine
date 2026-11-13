import clsx from 'clsx'
import { mixGradient, mixSplit } from '../../lib/area-mix.ts'
import './area-shape.css'

export type AreaShapeProps = {
  areas: string[]
  shape?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export const AreaShape = ({ areas, shape = 'cookie', size = 'md', label }: AreaShapeProps) => (
  <span
    className={clsx('area-shape', `area-shape--${size}`)}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    style={{
      clipPath: `var(--shape-${shape})`,
      background: size === 'sm' ? mixSplit(areas, 'fill') : mixGradient(areas, 'fill'),
    }}
  />
)
