import { css } from '@linaria/core'

export const viewport = css`
  position: fixed;
  right: 0;
  bottom: calc(var(--size-tabbar) + var(--space-lg));
  left: 0;
  z-index: 10;
  display: grid;
  gap: var(--space-sm);
  width: min(100%, var(--size-max-width));
  margin: 0 auto;
  padding: 0 var(--space-lg);
  list-style: none;
  outline: none;
`

export const toast = css`
  --toast-tone: var(--toast-success);
  --toast-shape: var(--shape-toast-success);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-sm) var(--space-sm) var(--space-md);
  border-radius: var(--radius-card);
  background: var(--background-inverse);
  color: var(--text-inverse);
  box-shadow: var(--shadow-raised);
  touch-action: none;
  user-select: none;

  &[data-state='open'] {
    animation: toast-in var(--motion-slow) var(--motion-easing);
  }

  &[data-state='closed'] {
    animation: toast-fade var(--motion-fast) var(--motion-easing) forwards;
  }

  &[data-swipe='move'] {
    transform: translateX(var(--radix-toast-swipe-move-x));
  }

  &[data-swipe='cancel'] {
    transform: translateX(0);
    transition: transform var(--motion-fast) var(--motion-easing);
  }

  &[data-swipe='end'] {
    animation: toast-swipe-out var(--motion-fast) var(--motion-easing) forwards;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(var(--space-lg));
    }
  }

  @keyframes toast-fade {
    to {
      opacity: 0;
    }
  }

  @keyframes toast-swipe-out {
    from {
      transform: translateX(var(--radix-toast-swipe-end-x));
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`

export const variants = {
  success: '',
  error: css`
    --toast-tone: var(--toast-error);
    --toast-shape: var(--shape-toast-error);
  `,
  warning: css`
    --toast-tone: var(--toast-warning);
    --toast-shape: var(--shape-toast-warning);
  `,
  info: css`
    --toast-tone: var(--toast-info);
    --toast-shape: var(--shape-toast-info);
  `,
  neutral: css`
    --toast-tone: var(--toast-neutral);
    --toast-shape: var(--shape-toast-neutral);
  `,
}

export const badge = css`
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: var(--size-toast-shape);
  height: var(--size-toast-shape);
  color: var(--toast-icon);
`

export const shape = css`
  position: absolute;
  inset: 0;
  background: var(--toast-tone);
  clip-path: var(--toast-shape);
`

export const icon = css`
  position: relative;
  width: var(--size-icon-sm);
  height: var(--size-icon-sm);
`

export const text = css`
  flex: 1;
  min-width: 0;
`

export const title = css`
  font-weight: var(--font-weight-semibold);
`

export const detail = css`
  font-size: var(--font-size-body-sm);
`

export const action = css`
  flex: none;
  min-height: var(--size-control);
  padding: 0 var(--space-md);
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--text-inverse-accent);
  font-weight: var(--font-weight-bold);
  cursor: pointer;

  &:active {
    background: var(--background-inverse-pressed);
  }

  @media (hover: hover) {
    &:hover {
      background: var(--background-inverse-hover);
    }
  }
`
