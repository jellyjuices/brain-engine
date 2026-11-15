import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { hitArea } from '../hit-area/hit-area.ts'
import { button, isBlock, isBusy, isIcon, sizes, variants } from './button.styles.ts'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  block?: boolean
  busy?: boolean
}

export const Button = ({ variant = 'primary', size = 'md', icon, block, busy, className, children, ...rest }: ButtonProps) => (
  <button
    type="button"
    className={clsx(button, hitArea, variants[variant], sizes[size], block && isBlock, !children && isIcon, busy && isBusy, className)}
    {...rest}
  >
    {icon}
    {children}
  </button>
)
