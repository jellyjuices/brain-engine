import type { CSSProperties, ReactNode } from 'react'
import { mixGlow } from '../../lib/area-mix.ts'
import './page-header.css'

export type PageHeaderProps = {
  title: string
  kicker?: string
  action?: ReactNode
  glow?: boolean
  children?: ReactNode
  areas?: string[]
}

export const PageHeader = ({ title, kicker, action, glow = true, children, areas }: PageHeaderProps) => (
  <header
    className={glow ? 'page-header has-glow' : 'page-header'}
    style={areas?.length ? ({ '--page-glow': mixGlow(areas) } as CSSProperties) : undefined}
  >
    <div className="page-header-top">
      <div>
        {kicker && <p className="page-header-kicker">{kicker}</p>}
        <h1 className="page-header-title">{title}</h1>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
    {children}
  </header>
)
