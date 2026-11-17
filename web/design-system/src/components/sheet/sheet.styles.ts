import { css } from '@linaria/core'

export const scrim = css`
  position: fixed;
  inset: 0;
  z-index: 30;
  background: var(--background-scrim);
  animation: sheet-fade var(--motion-slow) var(--motion-easing);

  &[data-state='closed'] {
    animation: sheet-fade var(--motion-fast) var(--motion-easing) reverse forwards;
  }

  @keyframes sheet-fade {
    from {
      opacity: 0;
    }
  }
`

export const grip = css`
  display: grid;
  place-items: center;
  height: var(--space-xl);
  cursor: grab;
  touch-action: none;

  @media (min-width: 48rem) {
    display: none;
  }
`

export const head = css`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: var(--size-control);
  padding: 0 var(--space-lg);
  touch-action: none;

  @media (min-width: 48rem) {
    touch-action: auto;
  }
`

export const sheet = css`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 31;
  display: flex;
  flex-direction: column;
  width: min(100%, var(--size-max-width));
  max-height: var(--size-sheet-max);
  margin: 0 auto;
  padding-bottom: var(--space-lg);
  border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
  background: var(--background-raised);
  color: var(--text-primary);
  box-shadow: var(--shadow-raised);
  transition: transform var(--motion-slow) var(--motion-easing);
  outline: none;

  &[data-state='open'] {
    animation: sheet-up var(--motion-slow) var(--motion-easing);
  }

  &[data-state='closed'] {
    animation: sheet-down var(--motion-fast) var(--motion-easing) forwards;
  }

  @keyframes sheet-up {
    from {
      transform: translateY(100%);
    }
  }

  @keyframes sheet-down {
    to {
      transform: translateY(100%);
    }
  }

  @media (min-width: 48rem) {
    top: 0;
    left: auto;
    width: var(--panel-width);
    max-height: none;
    margin: 0;
    padding-top: var(--space-lg);
    border-radius: var(--radius-sheet) 0 0 var(--radius-sheet);

    &[data-state='open'] {
      animation-name: sheet-in;
    }

    &[data-state='closed'] {
      animation-name: sheet-out;
    }
  }

  @keyframes sheet-in {
    from {
      transform: translateX(100%);
    }
  }

  @keyframes sheet-out {
    to {
      transform: translateX(100%);
    }
  }
`

export const isDragging = css`
  .${sheet}& {
    transition: none;
  }

  .${sheet}& .${grip} {
    cursor: grabbing;
  }
`

export const handle = css`
  width: var(--size-handle);
  height: var(--size-handle-height);
  border-radius: var(--radius-control);
  background: var(--border-strong);
`

export const title = css`
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-display-md);
  font-weight: var(--font-weight-regular);
`

export const description = css`
  margin: 0;
  padding: 0 var(--space-lg) var(--space-sm);
  font-size: var(--font-size-body-sm);
  color: var(--text-secondary);
`

export const body = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--space-sm);
`

export const close = css`
  margin-left: auto;
`
