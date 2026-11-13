import clsx from 'clsx'
import type { ReactNode } from 'react'
import './section-header.css'

export type SectionHeaderProps = {
  title: string
  count?: number
  tone?: 'default' | 'late'
  action?: ReactNode
  as?: 'h2' | 'h3'
}

export const SectionHeader = ({ title, count, tone = 'default', action, as: Heading = 'h2' }: SectionHeaderProps) => (
  <div className={clsx('section-header', tone === 'late' && 'is-late')}>
    <Heading className="section-header-title">
      {title}
      {count !== undefined && <span className="section-header-count">{count}</span>}
    </Heading>
    {action && <div className="section-header-action">{action}</div>}
  </div>
)
