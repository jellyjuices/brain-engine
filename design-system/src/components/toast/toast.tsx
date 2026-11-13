import clsx from 'clsx'
import { Toast as RadixToast } from 'radix-ui'
import { BellSimpleIcon, CheckIcon, InfoIcon, WarningIcon, XIcon, type Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import './toast.css'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral'

const icons: Record<ToastVariant, Icon> = {
  success: CheckIcon,
  error: XIcon,
  warning: WarningIcon,
  info: InfoIcon,
  neutral: BellSimpleIcon,
}

export const ToastProvider = ({ children, label = 'Notices' }: { children: ReactNode; label?: string }) => (
  <RadixToast.Provider swipeDirection="right" label={label}>
    {children}
    <RadixToast.Viewport className="toast-viewport" />
  </RadixToast.Provider>
)

export type ToastProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  detail?: string
  variant?: ToastVariant
  icon?: Icon
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

export const Toast = ({
  open,
  onOpenChange,
  message,
  detail,
  variant = 'success',
  icon,
  actionLabel,
  onAction,
  duration = 5000,
}: ToastProps) => {
  const Glyph = icon ?? icons[variant]
  return (
    <RadixToast.Root
      className={clsx('toast', `toast--${variant}`)}
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      type={variant === 'error' ? 'foreground' : 'background'}
    >
      <span className="toast-badge" aria-hidden>
        <span className="toast-shape" />
        <Glyph weight="regular" className="toast-icon" />
      </span>
      <div className="toast-text">
        <RadixToast.Title className="toast-title">{message}</RadixToast.Title>
        {detail && <RadixToast.Description className="toast-detail">{detail}</RadixToast.Description>}
      </div>
      {actionLabel && (
        <RadixToast.Action className="toast-action" altText={actionLabel} onClick={onAction}>
          {actionLabel}
        </RadixToast.Action>
      )}
    </RadixToast.Root>
  )
}
