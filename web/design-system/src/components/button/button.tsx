import { css } from '@linaria/core'
import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { hitArea } from '../hit-area/hit-area.ts'

const button = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-height: var(--size-control);
  padding: 0 var(--space-xl);
  border: 0;
  border-radius: var(--radius-control);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--motion-easing),
    scale var(--motion-fast) var(--motion-easing);

  &:active:not(:disabled) {
    scale: 0.97;
  }

  & svg {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
  }

  &:disabled {
    background: var(--background-disabled);
    color: var(--text-disabled);
    cursor: not-allowed;
    box-shadow: inset 0 0 0 var(--size-hair) var(--border-primary);
  }

  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      scale: 1;
    }
  }
`

const isBlock = css`
  .${button}& {
    width: 100%;
  }
`

const isIcon = css`
  .${button}& {
    width: var(--size-control);
    padding: 0;
  }
`

const sizes = {
  sm: css`
    min-height: calc(var(--size-control) - var(--space-md));
    padding: 0 var(--space-lg);
    font-size: var(--font-size-body-sm);
  `,
  md: css`
    font-size: var(--font-size-body-md);
  `,
  lg: css`
    min-height: calc(var(--size-control) + var(--space-sm));
    font-size: var(--font-size-body-lg);
  `,
}

const variants = {
  primary: css`
    background: var(--background-accent);
    color: var(--text-on-accent);

    &:active:not(:disabled) {
      background:
        linear-gradient(
          var(--background-accent-pressed),
          var(--background-accent-pressed)
        ),
        var(--background-accent);
    }

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background:
          linear-gradient(
            var(--background-accent-hover),
            var(--background-accent-hover)
          ),
          var(--background-accent);
      }
    }
  `,
  secondary: css`
    background: var(--background-accent-soft);
    color: var(--text-accent);

    &:active:not(:disabled) {
      background:
        linear-gradient(var(--background-pressed), var(--background-pressed)),
        var(--background-accent-soft);
    }

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background:
          linear-gradient(
            var(--background-accent-soft-hover),
            var(--background-accent-soft-hover)
          ),
          var(--background-accent-soft);
      }
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--text-accent);

    &:active:not(:disabled) {
      background: var(--background-pressed);
    }

    &:disabled {
      background: transparent;
      box-shadow: none;
    }

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background: var(--background-hover);
      }
    }
  `,
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  block?: boolean
}

export const Button = ({ variant = 'primary', size = 'md', icon, block, className, children, ...rest }: ButtonProps) => (
  <button
    type="button"
    className={clsx(button, hitArea, variants[variant], sizes[size], block && isBlock, !children && isIcon, className)}
    {...rest}
  >
    {icon}
    {children}
  </button>
)
