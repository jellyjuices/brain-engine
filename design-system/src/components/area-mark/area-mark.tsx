import clsx from 'clsx'
import { splitAreas } from '../../lib/area-mix.ts'
import { AreaShape } from '../area-shape/area-shape.tsx'
import './area-mark.css'

export type AreaMarkProps = {
  areas: string[]
  shape?: string
  size?: 'sm' | 'md'
  label?: string
}

export const AreaMark = ({ areas, shape = 'circle', size = 'sm', label }: AreaMarkProps) => {
  const { shown, extra } = splitAreas(areas)
  if (shown.length === 0) return null
  return (
    <span className={clsx('area-mark', `area-mark--${size}`)} role={label ? 'img' : undefined} aria-label={label}>
      <AreaShape areas={shown} shape={shape} size={size} />
      {extra > 0 && (
        <span className="area-mark-extra" aria-hidden>
          +{extra}
        </span>
      )}
    </span>
  )
}
