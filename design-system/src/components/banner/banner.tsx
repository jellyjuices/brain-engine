import { TrayIcon } from '@phosphor-icons/react'
import { Button } from '../button/button.tsx'
import './banner.css'

export type BannerProps = {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export const Banner = ({ message, actionLabel, onAction }: BannerProps) => (
  <div className="banner" role="status">
    <TrayIcon aria-hidden className="banner-icon" />
    <p className="banner-message">{message}</p>
    {actionLabel && (
      <Button variant="primary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
)
