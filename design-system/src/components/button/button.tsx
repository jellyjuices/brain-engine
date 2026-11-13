import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './button.css'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  block?: boolean
}

export const Button = ({ variant = 'primary', size = 'md', icon, block, className, children, ...rest }: ButtonProps) => (
  <button
    type="button"
    className={clsx('button', 'hit-area', `button--${variant}`, `button--${size}`, block && 'is-block', !children && 'is-icon', className)}
    {...rest}
  >
    {icon}
    {children}
  </button>
)
