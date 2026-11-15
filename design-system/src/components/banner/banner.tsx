import { TrayIcon } from '@phosphor-icons/react'
import { Button } from '../button/button.tsx'
import './banner.css'

export type BannerProps = {
  message: string
  count?: number
  actionLabel?: string
  onAction?: () => void
}

export const Banner = ({ message, count, actionLabel, onAction }: BannerProps) => (
  <div className="banner" role="status">
    <TrayIcon aria-hidden className="banner-icon" />
    <p className="banner-message">
      {count !== undefined && <span className="banner-count">{count}</span>}
      {message}
    </p>
    {actionLabel && (
      <Button variant="primary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
)
