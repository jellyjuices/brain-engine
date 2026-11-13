import clsx from 'clsx'
import type { ComponentProps } from 'react'
import type { Icon } from '@phosphor-icons/react'
import './icon-button.css'

export type IconButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  icon: Icon
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const IconButton = ({ icon: Glyph, label, variant = 'ghost', size = 'md', className, ...rest }: IconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={clsx('icon-button', 'hit-area', `icon-button--${variant}`, `icon-button--${size}`, className)}
    {...rest}
  >
    <Glyph aria-hidden weight={variant === 'primary' ? 'bold' : 'regular'} className="icon-button-glyph" />
  </button>
)
