import clsx from 'clsx'
import { Toast as RadixToast } from 'radix-ui'
import { BellSimpleIcon, CheckIcon, InfoIcon, WarningIcon, XIcon, type Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import * as styles from './toast.styles.ts'

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
    <RadixToast.Viewport className={styles.viewport} />
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
      className={clsx(styles.toast, styles.variants[variant])}
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      type={variant === 'error' ? 'foreground' : 'background'}
    >
      <span className={styles.badge} aria-hidden>
        <span className={styles.shape} />
        <Glyph weight="regular" className={styles.icon} />
      </span>
      <div className={styles.text}>
        <RadixToast.Title className={styles.title}>{message}</RadixToast.Title>
        {detail && <RadixToast.Description className={styles.detail}>{detail}</RadixToast.Description>}
      </div>
      {actionLabel && (
        <RadixToast.Action className={styles.action} altText={actionLabel} onClick={onAction}>
          {actionLabel}
        </RadixToast.Action>
      )}
    </RadixToast.Root>
  )
}
