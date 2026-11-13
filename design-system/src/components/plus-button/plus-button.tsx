import clsx from 'clsx'
import { PlusIcon } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes } from 'react'
import './plus-button.css'

export type PlusButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  size?: 'md' | 'lg'
  raised?: boolean
}

export const PlusButton = ({ label, size = 'md', raised, className, ...rest }: PlusButtonProps) => (
  <button
    type="button"
    aria-label={label}
    className={clsx('plus-button', `plus-button--${size}`, raised && 'is-raised', className)}
    {...rest}
  >
    <span className="plus-button-shape" aria-hidden />
    <PlusIcon weight="bold" aria-hidden className="plus-button-icon" />
  </button>
)
