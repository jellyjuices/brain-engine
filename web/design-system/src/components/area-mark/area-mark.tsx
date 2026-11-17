import { css } from '@linaria/core'
import clsx from 'clsx'
import { splitAreas } from '../../lib/area-mix.ts'
import { AreaShape, areaShape } from '../area-shape/area-shape.tsx'

const areaMark = css`
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--space-2xs);
`

const extra = css`
  font-family: var(--font-number);
  font-size: var(--font-size-number-xs);
  line-height: var(--font-leading-tight);
  color: var(--text-secondary);
`

const sizes = {
  sm: css`
    & .${areaShape} {
      width: var(--font-size-body-sm);
      height: var(--font-size-body-sm);
    }
  `,
  md: css`
    & .${extra} {
      font-size: var(--font-size-number-sm);
    }
  `,
}

export type AreaMarkProps = {
  areas: string[]
  shape?: string
  size?: 'sm' | 'md'
  label?: string
}

export const AreaMark = ({ areas, shape = 'circle', size = 'sm', label }: AreaMarkProps) => {
  const { shown, extra: extraCount } = splitAreas(areas)
  if (shown.length === 0) return null
  return (
    <span className={clsx(areaMark, sizes[size])} role={label ? 'img' : undefined} aria-label={label}>
      <AreaShape areas={shown} shape={shape} size={size} />
      {extraCount > 0 && (
        <span className={extra} aria-hidden>
          +{extraCount}
        </span>
      )}
    </span>
  )
}
